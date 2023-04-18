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
    // avoid to have a fast restart
    wheel_l = 0;
    wheel_r = 0;
    activate = false;

    //music.playTone(SOUND_STOP, music.beat(BeatFraction.Whole));
    led_off();
}

/**
 * Turn on the bot
 */
function BotOn(): void {
    affichage_temporaire(MESSAGE_START);
    activate = true;
    // music.playTone(SOUND_START, music.beat(BeatFraction.Whole));
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
        if (activate && main_methode === METHODE_IR) methode_ir(msg);


        last_command = now;
    }
    
})

input.onButtonPressed(Button.A, function () {
    main_methode = METHODE_LINE;
})

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
const POWER_MAX = 255;
const SCREEN_WIDTH = 320;
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
// METHODE
const METHODE_IR = "IR";
const METHODE_LINE = "LINE";
const METHODE_FUNCTION = "FUNCTION";

// IR CONSTANT
const IR_ON_OFF = 129;
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
let FACTOR_ROTATION = 1 / 5;
let upgrade_rotation: number;

////////// DEFAULT //////////

const DEFAULT_METHODE = METHODE_IR;

////////// GLOBALES VARIABLES //////////
let activate = false;
let main_methode = DEFAULT_METHODE;
// à l'arrêt


////////////////////////////////////////////// METHODE //////////////////////////////////////////////




////////////////////////////////////////////// INIT //////////////////////////////////////////////
radio.setGroup(RADIO_GROUP)
// // initialise la caméra
// huskylens.initI2c()

let delay_ir_command = 750 ; //millisecond
let last_command = input.runningTime();

///////////////////////////////////
//////////// MAIN LOOP ////////////
/////////////////////////////////// 

basic.forever(function () {

    if (activate) {
        // actualise la rotation
        upgrade_rotation = (wheel_l + wheel_r) * FACTOR_ROTATION;
        radio.sendValue("vitesse", (wheel_l + wheel_r) / 2);
        // peremet de conserver un angle constant


        //let sonar_dist = Math.round(DFRobotMaqueenPlus.ultraSonic(PIN.P1, PIN.P2))

        //if (sonar_dist < 30 ){
        //    BotOff();
        //}

        // TODO : function principale
        // main();

        // Rattrapge d'urgence
        // si input.acceleration...
        // ou si input shake
        if (false) {
            (wheel_l + wheel_r > 0) ? move(-POWER_MAX, -POWER_MAX) : move(POWER_MAX, POWER_MAX)
            // music.playTone SOUND_ALARM;
        }
    }
})