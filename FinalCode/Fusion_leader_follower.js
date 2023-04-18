////////////////////////////////////////
////////////MOVING FUNCTIONS////////////
////////////////////////////////////////

/**
 * Give power to the wheel
 * @param {number} l power of left wheel
 * @param {number} r  power of right wheel
 * @argument if value < 0 then backwards, else forward
 * @argument if value == 0 => stop wheels
 */
function move(l: number, r: number): void {

    // To avoid noise when low power
    if (l >= -10 && l <= 10 && r >= -10 && r <= 10) {
        DFRobotMaqueenPlus.mototStop(Motors.ALL);
    } else {
        DFRobotMaqueenPlus.mototRun(Motors.M1, l < 0 ? Dir.CCW : Dir.CW, Math.abs(l));
        DFRobotMaqueenPlus.mototRun(Motors.M2, r < 0 ? Dir.CCW : Dir.CW, Math.abs(r));
    }
}


/////////////////////////////////
//////////// UTILITY ////////////
/////////////////////////////////

/**
 * Print a message on the diod card 
 * @param {*} msg message printed
 * @param {*} time duration of the message, default is 0.5 seconds
 */
function affichage_temporaire(msg: string, time: number = 500): void {
    basic.showString(msg)
    control.inBackground(function () {
        basic.pause(time)
        basic.clearScreen()
    })
}


/**
 * Turn on the bot
 */
function BotOn(): void {
    affichage_temporaire(MESSAGE_START);
    activate = true;
    music.playTone(SOUND_START, 100);
    DFRobotMaqueenPlus.setRGBLight(RGBLight.RGBR, Color.WHITH);
    DFRobotMaqueenPlus.setRGBLight(RGBLight.RGBL, Color.WHITH);

}

/**
 * Evite les dépassement de valeur
 * @param {number} v le nombre à vérifier
 * @returns la valuer corrigée si nécessaire
 */
function outOfRange(v: number): number {
    if (v < -POWER_MAX) return -POWER_MAX;
    if (v > POWER_MAX) return POWER_MAX;
    return v;
}

///////////////////////////////////////
//////////// EVENT and CHOICE//////////
///////////////////////////////////////

// MAIN BUTTON
input.onLogoEvent(TouchButtonEvent.Pressed, function () {
    activate ? BotOff() : BotOn();
})

// SAME AS LEADER

////////////////////////////////////////////////////////////////////////////////////////////////////


// IR instructions
IR.IR_callbackUser(function (msg) {
    // si télécommande
    if (msg == IR_ON_OFF) activate ? BotOff() : BotOn();
})

radio.onReceivedString(function (receivedString: string) {
    // si un autre robot envoie des msg en rapport avec le contact visuel
    if (receivedString == LOST_CONTACT_VISUEL) BotOff();
    if (receivedString == BACK_CONTACT_VISUEL) BotOn();
})
 

///////////////////////////////
//////////// SETUP ////////////
///////////////////////////////


//////////////////////////////////////////////GENERAL//////////////////////////////////////////////

// function qr : similar to function follow_motif
// V2 de follow_motif
function followe_qrV2(): void {
    huskylens.request()

    // ORDER PRIORITY --> left, right , front
    if (huskylens.isAppear(2, HUSKYLENSResultType_t.HUSKYLENSResultBlock)) { process_follow(2); }// left
    else if (huskylens.isAppear(3, HUSKYLENSResultType_t.HUSKYLENSResultBlock)) { process_follow(3); } // right

    //front
    else if (huskylens.isAppear(1, HUSKYLENSResultType_t.HUSKYLENSResultBlock)) {
        // process_follow(1);

        // check if multi box
        // le plus loin à la plus petite hauteur
        let max_index = 1
        let max_height = huskylens.readeBox_index(1, 1, Content1.height)
        let len_box = huskylens.getBox_S(1, HUSKYLENSResultType_t.HUSKYLENSResultBlock) // nombre de box

        for (let i = 1; i <= len_box; i++) {
            // num de boite commence a 1
            if (huskylens.readeBox_index(1, i, Content1.height) > max_height) {
                max_height = huskylens.readeBox_index(1, i, Content1.height)
                max_index = i
            }
        }
        // suit le front ayant la hauteur maxiam == le qr code le plus près
        process_follow(1, max_index);
    }


    else {
        // check si perte récente du QR code ou non
        if(input.runningTime() - last_qr_visible > delay_lost_qr){
            // si temps perdu supérieur au délais établie, alors considérer comme lost

            if (input.runningTime() - last_qr_visible >  lost_definitif){
                move(0,0)
            }
            else{
                radio.sendString(LOST_CONTACT_VISUEL)
                lost = true
            }   
        }
        
        // CONTINUE DANS LA PRECEDENTE DIRECTION SI PERTE DE CONTACTE
        // move(0, 0);

    }

}

function process_follow(num_qr: number, num_box = 1) {
    if (lost) {
        lost = false
        last_qr_visible = input.runningTime() // rappelle que le qr a été retrouvé
        radio.sendString(BACK_CONTACT_VISUEL)
    }

    // hauteur apparante du QR
    let height = huskylens.readeBox_index(num_qr, num_box, Content1.height)
    // x de la boite détectée
    let x_center = huskylens.readeBox_index(num_qr, num_box, Content1.xCenter)

    //left
    if (num_qr == 2) {
        x_center *= 0.75;
    }
    // right
    if (num_qr == 3) {
        x_center *= 1.25;
    }

    // estimation de la distance du QR à partir de la hauteur apparante
    //let dist = 1501.6 - 1259.41 * Math.pow(height, 0.0322027);
    let dist = 509.327 - 46.6558 * Math.log(0.0000276626 - 234.427 * - height)
    // coef = ya - yb / xa - xb
    // let coef_directeur = (0 - POWER_MAX) / (DISTANCE_MIN - DISTANCE_MAX);
    // let power = coef_directeur * dist - POWER_MAX;
    
    // my_vitesse_max = 250;
    //( ya - yb) / (xa - sb)
    let coef_directeur = (0 - POWER_MAX) / (DISTANCE_MIN - DISTANCE_MAX);
    let power = coef_directeur * dist - POWER_MAX;

    // Répartition de la puissance pour touner
    // si tout à gauche powerL = POWER_MAX*0/SCREEN_WIDTH = 0
// qrCodeLocation_x


    let powerL = (power * x_center / SCREEN_WIDTH);
    // si tout à droite powerR = POWER_MAX - POWER_MAX*SCREEN_WIDTH/SCREEN_WIDTH = 0
    let powerR = (power - power * x_center / SCREEN_WIDTH);

    // Vérification de l'égalité entre le rapport powerL/powerR par rapport à speed_wheelL/speed_wheelR
    // powerL, powerR = calibration(powerL, powerR);
    move(powerL, powerR);

}

function calibration(powerL: number, powerR: number): number {

    // Speed measure
    let speedL = DFRobotMaqueenPlus.readSpeed(Motors1.M1)
    let speedR = DFRobotMaqueenPlus.readSpeed(Motors1.M1)

    let ratioL = speedL / powerL // ==> vitesse obtenu par rapport à power
    // 0 = perte total , +++ = pas de perte
    let ratioR = speedR / powerR

    // si perte de L inférieur à perte de R
    if (ratioL < ratioR) {
        // augmenter r
        let new_r = powerR + (ratioR - ratioL) * powerR
        return powerL, new_r;
    }
    else {
        // augmenter L
        let new_l = powerL + (ratioL - ratioR) * powerL
        return new_l, powerR
    }
}


function follow_qr(): void {
    huskylens.request()
    if (huskylens.isAppear(1, HUSKYLENSResultType_t.HUSKYLENSResultBlock)) {

        //CALCUL DE PUISSANCE

        // Hauteur max = environ 6/10 de l'écran ->3/5
        // taille apparante du QR
        let height = huskylens.readeBox(1, Content1.height)
        //let widht = huskylens.readeBox(1,Content1.width) // Largeur : tou
        let x_center = huskylens.readeBox(1, Content1.xCenter)  // 0 
        // let POWER_MAX = power - power * height / SCREEN_HEIGHT

        // si prend tout l'écran : vitesse null
        //

        let distance_factor = height / SCREEN_HEIGHT
        let power = POWER_MAX - POWER_MAX * distance_factor;

        // Répartition de la puissance pour touner
        // si tout à gauche powerL = POWER_MAX*0/SCREEN_WIDTH = 0
        let powerL = (power * x_center / SCREEN_WIDTH);
        // si tout à droite powerR = POWER_MAX - POWER_MAX*SCREEN_WIDTH/SCREEN_WIDTH = 0
        let powerR = (power - power * x_center / SCREEN_WIDTH);

        // UTILISATION DE LA PUISSANCE + ALLUMAGE RGB
        move(powerL, powerR);
    }

    else {
        move(0, 0);
    }
}

////////// CONSTANT ////////// 

// VALUE
//const POWER_MAX = 120; // 255
const RADIO_GROUP = 1;
// TEXTE
const MESSAGE_START = 'R';
const MESSAGE_STOP = 'S';
// SOUND
const SOUND_START = Note.A;
const SOUND_STOP = Note.B;
const SOUND_ALARM = Note.C;
const SOUND_CHOICE_A = Note.D;
const SOUND_CHOICE_B = Note.E;
// IR CONSTANT
const IR_ON_OFF = 129;
const LOST_CONTACT_VISUEL = "lost"
const BACK_CONTACT_VISUEL = "back"
// SCREEN
const SCREEN_WIDTH = 320;
const SCREEN_HEIGHT = 240;

// Distance souhaitée entre meneur et follower (en centimetre)
const DISTANCE_MAX = 100;
const DISTANCE_MIN = 50; // D2termination de la distance marche pas ??? 

////////// GLOBALES VARIABLES //////////
let activate = false;

// indique s'il est perdu ou pas
let lost = false


////////////////////////////////////////////// INIT //////////////////////////////////////////////

radio.setGroup(RADIO_GROUP)
// initialise la caméra
// huskylens.initMode(protocolAlgorithm.ALGORITHM_OBJECT_TRACKING)
huskylens.initMode(protocolAlgorithm.ALGORITHM_TAG_RECOGNITION);
///////////////////////////////////
//////////// MAIN LOOP ////////////
///////////////////////////////////


// on se donne 3 essaies de request
// marche jamais sur l'essaie 1 je c pas pk

let isLeader = false
// le bot devient lieader si on appuit sur A
input.onButtonPressed(Button.A, function () {
    isLeader = !isLeader
    music.playTone(Note.C, 100) // joue son pendant 0,1 s pour indiquer que c'est le leader
})


/*
ANCIENNE VERSION DE DETERMINATION DU LEADER
huskylens.initMode(protocolAlgorithm.ALGORITHM_TAG_RECOGNITION);

for(let i = 0 ; i < 3 ; i++){
    huskylens.request()
    if(huskylens.isAppear(1, HUSKYLENSResultType_t.HUSKYLENSResultBlock)) {
        isLeader = false
    }
}
*/


//////////////// LEADER CTRL-C / CTRL-V //////////////////////


/////////////////////////////////
//////////// UTILITY ////////////
/////////////////////////////////


/**
 * Turn off the bot
 */
// version leader
function BotOff(): void {
    affichage_temporaire(MESSAGE_STOP);
    move(0, 0);
    // avoid to have a fast restart
    wheel_l = 0;
    wheel_r = 0;
    activate = false;
    music.playTone(SOUND_STOP, 100);
    led_off();
}

///////////////////////////////////////
/////////////////COLOR/////////////////
///////////////////////////////////////

/**
 * Turn off the LEDs
 */
function led_off(): void {
    DFRobotMaqueenPlus.setRGBLight(1, Color.OFF)
    DFRobotMaqueenPlus.setRGBLight(2, Color.OFF)
}


// les diodes révelent la puissance mise dans les roues
/**
 * Give a color to the LEDss
 * @param {*} wheel the side associated with the wheel
 * @param {number} current_power the power associated with the wheel
 */
function gradient_color_led(wheel: number, current_power: number): void {

    let seuil = POWER_MAX / 3 // car 3 couleur différentes 
    // seuil 1
    if (current_power <= seuil) {
        DFRobotMaqueenPlus.setRGBLight(wheel, Color.RED)
    }
    // seuil 2
    else if (current_power <= 2 * seuil) {
        DFRobotMaqueenPlus.setRGBLight(wheel, Color.GREEN)
    }
    // seuil 3
    else if (current_power <= 3 * seuil) {
        DFRobotMaqueenPlus.setRGBLight(wheel, Color.BLUE)
    }
}

///////////////////////////////////////
//////////// EVENT and CHOICE//////////
///////////////////////////////////////

// MAIN BUTTON
input.onLogoEvent(TouchButtonEvent.Pressed, function () {
    activate ? BotOff() : BotOn();
})

// IR instructions
IR.IR_callbackUser(function (msg) {
    let now = input.runningTime();

    // delay command
    if ((now - last_command) > delay_ir_command) {

        if (msg == IR_ON_OFF) activate ? BotOff() : BotOn();
        // Add vérification option OU pas on verra
        if (activate && main_methode === METHODE_IR && isLeader) methode_ir(msg);

        last_command = now;
    }

})
/*
input.onButtonPressed(Button.A, function () {
    main_methode = METHODE_LINE;
})
*/
input.onButtonPressed(Button.B, function () {
    main_methode = METHODE_FUNCTION;
})

///////////////////////////////////////
//////////// MAIN FUNCTION ////////////
///////////////////////////////////////

///////// IR /////////
function methode_ir(msg: number): void {
    switch (msg) {
        case IR_UP:
            wheel_l += UPGRADE_POWER;
            wheel_r += UPGRADE_POWER;
            break;

        case IR_DOWN:
            wheel_l -= UPGRADE_POWER;
            wheel_r -= UPGRADE_POWER;
            break;

        case IR_LEFT:
            wheel_l -= upgrade_rotation;
            wheel_r += upgrade_rotation;
            break;

        case IR_RIGHT:
            wheel_l += upgrade_rotation;
            wheel_r -= upgrade_rotation;
            break;

        default: // NOTHING 
    }

    // Avoid ouOfRange int
    wheel_l = outOfRange(wheel_l);
    wheel_r = outOfRange(wheel_r);

    move(wheel_l, wheel_r);
    gradient_color_led(2, wheel_l);
    gradient_color_led(1, wheel_r);
}


///////// LINE /////////


function methode_line() {

    let captor_priority = {
        L3: 1, // Angle = 90 - 0 = 0°
        L2: 0.35, // Angle = 90-58 = 32 ; 90-32 = 58 ; 58/90 = 0.644 ; 1-0.644 = ... = 0.35
        L1: 0.12, // Angle = 1-79.12/90
    }

    // rappele : ils sont symétrique 
    let captor_weight = [1, 0.35, 0.12];

    // Update value capteur
    let R1 = DFRobotMaqueenPlus.readPatrol(Patrol.R1) == 1;
    let R2 = DFRobotMaqueenPlus.readPatrol(Patrol.R2) == 1;
    let R3 = DFRobotMaqueenPlus.readPatrol(Patrol.R3) == 1;
    let L1 = DFRobotMaqueenPlus.readPatrol(Patrol.L1) == 1;
    let L2 = DFRobotMaqueenPlus.readPatrol(Patrol.L2) == 1;
    let L3 = DFRobotMaqueenPlus.readPatrol(Patrol.L3) == 1;

    let right_captor = [R1, R2, R3];
    let left_captor = [L1, L2, L3];

    // code dégueulasse : 

    if (L1 && R1) {
        // move(100, 100)
        move(80, 80)
    } else if (!(L2) && L1 && !(R1)) {
        // move(100, 80)
        move(80, 60)
    } else if (L2 && L1) {

        //move(110, 60)
        move(90, 40)
    } else if (L2 && !(L1)) {
        // move(90, 10)
        move(110, 30)
    } else if (L3) {
        // move(120, 30)
        move(100, 10)
    } else if (!(R2) && !(L1) && R1) {
        // move(80, 100)
        move(60, 80)
    } else if (R2 && R1) {
        //move(60, 110)
        move(40, 90)
    } else if (R2 && !(R1)) {
        // move(30, 110)
        move(10, 90)
    } else if (R3) {
        // move(30, 120)
        move(10, 100)
    }
}

// permet de suivre une ligne grace au sensor distribution R3 R2 R1 L1 L2 L3 si readPatrol == 1 signifie au dessus de ligne noire
function follow_line() {

}

///////////////////////////////
//////////// SETUP ////////////
///////////////////////////////


//////////////////////////////////////////////GENERAL//////////////////////////////////////////////

////////// CONSTANT ////////// 

// VALUE

const POWER_MAX = 255; // maximum value in input

// METHODE
const METHODE_IR = "IR";
const METHODE_LINE = "LINE";
const METHODE_FUNCTION = "FUNCTION";

const IR_UP = 198;
const IR_DOWN = 199;
const IR_LEFT = 200;
const IR_RIGHT = 201;
// puissance ajoutée à chaque pression d'accélération / décélération
//const UPGRADE_POWER = 25;
//const upgrade_rotation = 1 / 3 * UPGRADE_POWER;
const UPGRADE_POWER = 50;


let wheel_l = 0;
let wheel_r = 0;
let FACTOR_ROTATION = 2 / 10; // permet à la rotation de pas être trop vioente et constante
let upgrade_rotation: number;

////////// DEFAULT //////////

const DEFAULT_METHODE = METHODE_IR;

////////// GLOBALES VARIABLES //////////
let main_methode = DEFAULT_METHODE;
// à l'arrêt


////////////////////////////////////////////// METHODE //////////////////////////////////////////////


////////////////////////////////////////////// INIT //////////////////////////////////////////////
radio.setGroup(RADIO_GROUP)
// // initialise la caméra
// huskylens.initI2c()

const delay_ir_command = 500; //millisecond  // évite de spmmer la télécommande
let last_command = input.runningTime(); // date de quand le dernier input à était émis

const delay_lost_qr = 1000 // ms // évite de dire "lost" (et donc de tout stopper) à la moindre perte de contacte
let last_qr_visible = input.runningTime(); // date de la dernier fois ou le qr a été vu
const lost_definitif = 2500 // ms

///////////////////////////////////
//////////// MAIN LOOP ////////////
///////////////////////////////////


/////////////////END CTRL////////////////////



basic.forever(function () {

    // pins.digitalWritePin(DigitalPin.P0, 1)
    // quasiment rien comme courrant --> impossible que ça s'allume

    if (!isLeader) {
        // si activate
        if (activate) {
            //follow le qr
            followe_qrV2();
        }
    }

    // leader
    else if (activate) {
        // actualise la rotation
        upgrade_rotation = (wheel_l + wheel_r) * FACTOR_ROTATION;
        radio.sendValue("vitesse", (wheel_l + wheel_r) / 2);
        // peremet de conserver un angle constant

    }
})