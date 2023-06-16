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
 * Turn off the bot
 */
function BotOff(): void {
    affichage_temporaire(MESSAGE_STOP);
    move(0, 0);
    activate = false;

    //music.playTone(SOUND_STOP, music.beat(BeatFraction.Whole));

    // TODO : change color for None
    DFRobotMaqueenPlus.setRGBLight(RGBLight.RGBR, Color.OFF);
    DFRobotMaqueenPlus.setRGBLight(RGBLight.RGBL, Color.OFF);
}

/**
 * Turn on the bot
 */
function BotOn(): void {
    affichage_temporaire(MESSAGE_START);
    activate = true;
    //music.playTone(SOUND_START, music.beat(BeatFraction.Whole));
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

/*
// RADIO
radio.onReceivedValue(function (name: string, value: number) {
    if (name == "vitesse") {
        my_vitesse_max = value;
    }
})
 
*/
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

        for (let i = 1; i < huskylens.getBox_S(1, HUSKYLENSResultType_t.HUSKYLENSResultBlock); i++) {
            if (huskylens.readeBox_index(1, i, Content1.height) > max_height){
                max_height = huskylens.readeBox_index(1, i, Content1.height)
                max_index = i
            }
        }
        // suit le front ayant la hauteur maxiam == le qr code le plus près
        process_follow(1, max_index);
    }


    else {
        radio.sendString(LOST_CONTACT_VISUEL)
        lost = true
        // CONTINUE DANS LA PRECEDENTE DIRECTION SI PERTE DE CONTACTE
        // move(0, 0);

    }

}

function process_follow(num_qr: number, num_box = 1) {
    if (lost) {
        lost = ! false
        radio.sendString(BACK_CONTACT_VISUEL)
    }

    // hauteur apparante du QR
    let height = huskylens.readeBox_index(num_qr, num_box , Content1.height)
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
    my_vitesse_max = 250;
    let coef_directeur = (0 - my_vitesse_max) / (DISTANCE_MIN - DISTANCE_MAX);
    let power = coef_directeur * dist - my_vitesse_max;

    // Répartition de la puissance pour touner
    // si tout à gauche powerL = POWER_MAX*0/SCREEN_WIDTH = 0
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
const POWER_MAX = 120;
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

let my_vitesse_max = 80;
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
input.onButtonPressed(Button.A, function() {
    isLeader = !isLeader 
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


basic.forever(function () {
    if(!isLeader){
        // si activate
        if (activate) {
            //follow le qr
            followe_qrV2();
        }
    }
    else{
        basic.showIcon(IconNames.Sad)
    }
})



