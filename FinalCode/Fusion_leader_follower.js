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
 * Print a message on the LED matrix for a specified duration
 * @param {string} message message to be displayed
 * @param {number} duration duration of the message in milliseconds (default is 500ms)
 */
function temporaryDisplayMessage(message: string, duration: number = 500): void {
    basic.showString(message);
    control.inBackground(function () {
        basic.pause(duration);
        basic.clearScreen();
    });
}


/**
 * Turn on the bot
 */
function turnOnRobot(): void {
    temporaryDisplayMessage(MESSAGE_START);
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
function getBoundedValue(v: number): number {
    if (v < -MAX_POWER) return -MAX_POWER;
    if (v > MAX_POWER) return MAX_POWER;
    return v;
}

///////////////////////////////////////
//////////// EVENT and CHOICE//////////
///////////////////////////////////////

// MAIN BUTTON
input.onLogoEvent(TouchButtonEvent.Pressed, function () {
    activate ? turnOffRobot() : turnOnRobot();
})

////////////////////////////////////////////////////////////////////////////////////////////////////

// IR instructions
IR.IR_callbackUser(function (msg) {
    // if the robot is activated , it is turned off
    // else it is turned on
    if (msg == IR_ON_OFF) activate ? turnOffRobot() : turnOnRobot();
})

radio.onReceivedString(function (receivedString: string) {
    // if another robot sends messages related to visual contact
    if (receivedString == LOST_CONTACT_VISUEL) turnOffRobot();
    if (receivedString == BACK_CONTACT_VISUEL) turnOnRobot();
})
 

///////////////////////////////
//////////// SETUP ////////////
///////////////////////////////


//////////////////////////////////////////////GENERAL//////////////////////////////////////////////

// function qr : similar to function follow_motif
// V2 de follow_motif
function followe_qrV2(): void {
    huskylens.request()

    // Follow order of priority --> left, right , front
    if (huskylens.isAppear(2, HUSKYLENSResultType_t.HUSKYLENSResultBlock)) { process_follow(2); }// left
    else if (huskylens.isAppear(3, HUSKYLENSResultType_t.HUSKYLENSResultBlock)) { process_follow(3); } // right

    // Follow front
    else if (huskylens.isAppear(1, HUSKYLENSResultType_t.HUSKYLENSResultBlock)) {
        // Check if there are multiple boxes
        // From farthest to closest in terms of height
        let max_index = 1
        let max_height = huskylens.readeBox_index(1, 1, Content1.height)
        let len_box = huskylens.getBox_S(1, HUSKYLENSResultType_t.HUSKYLENSResultBlock) // nombre de box

        for (let i = 1; i <= len_box; i++) {
            // Box number starts at 1 , don't no why
            if (huskylens.readeBox_index(1, i, Content1.height) > max_height) {
                max_height = huskylens.readeBox_index(1, i, Content1.height)
                max_index = i
            }
        }
        // Follow the front with the maximum height == closest QR code
        process_follow(1, max_index);
    }


    else {
        // Check if recent loss of QR code contact or not
        if(input.runningTime() - last_time_qr_visible > delay_lost_qr){
            // If lost time is greater than the established delay, then consider it as lost
            if (input.runningTime() - last_time_qr_visible >  delay_lost_definitif){
                move(0,0)
            }
            else{
                radio.sendString(LOST_CONTACT_VISUEL)
                lost = true
            }   
        }
        
        // Continue in the previous direction if there is loss of contact

    }

}

/**
 * Processes a detected QR code and adjusts the robot's movement accordingly
 * @param tag - The tag associated with the qr code detected
 * @param boxIndex - Index of the box within the detected tag (optional, default value = 1)
 */
function processQR(tag: number, boxIndex = 1) {
    // If the QR code was previously lost, send a message and update the last visible time
    if (lost) {
        lost = false
        // Send message to other 
        last_time_qr_visible = input.runningTime()
        radio.sendString(BACK_CONTACT_VISUEL)
    }

    // Apparent height of QR
    let height = huskylens.readeBox_index(tag, boxIndex, Content1.height)
    // X-coordinate of the detected box
    let box_position = huskylens.readeBox_index(tag, boxIndex, Content1.xCenter)

    // Adjust box_position based on QR position
    // Left
    if (tag == 2) {
        box_position *= 0.75;
    }
    // Right
    if (tag == 3) {
        box_position *= 1.25;
    }

    // Estimation of the distance of the QR from the apparent height
    /* Old formul :
    Do not work because the exposant is interpreted as 0 and not as 0.0322027 
    let dist = 1501.6 - 1259.41 * Math.pow(height, 0.0322027);
    */

    // New formula
    let dist = 509.327 - 46.6558 * Math.log(0.0000276626 - 234.427 * - height)    
    // coef directeur de y = ax+b --> a = ( ya - yb) / (xa - sb)

    let slop = (0 - MAX_POWER) / (DISTANCE_MIN - DISTANCE_MAX);
    let power = slop * dist - MAX_POWER;

    // Calculation of power distribution for turning

    // if the QR is all the way to the left, powerL = 0
    let powerL = (power * box_position / SCREEN_WIDTH);
    // if the QR is all the way to the right, powerR = 0
    //let powerR = (power - power * box_position / SCREEN_WIDTH);
    let powerR = power - powerL;

    // Calibration of powerL and powerR to ensure equal movement speed
    // powerL, powerR = calibration(powerL, powerR);

    // Move the robot using the calculated power distribution
    move(powerL, powerR);

}


/**
 * Calibrates the power of the left and right wheels based on the measured speed
 * @param powerL - Desired power for the left wheel
 * @param powerR - Desired power for the right wheel
 * @returns The new power values for the left and right motors.
 * @note This function is not currently used due to sensor inaccuracies
 */
function calibration(powerL: number, powerR: number): number {

    // Speed measure
    let speedL = DFRobotMaqueenPlus.readSpeed(Motors1.M1)
    let speedR = DFRobotMaqueenPlus.readSpeed(Motors1.M1)

    // Calculate the efficiency ratios of the motors (speed/power)
    let efficiencyL = speedL / powerL // efficiency of the left motor
    let efficiencyR = speedR / powerR // efficiency of the right motor

    // If the left motor is less efficient than the right motor, increase the right motor power
    if (efficiencyL < efficiencyR) {
        // Increase the power supplied to the right motor
        let new_r = powerR + (efficiencyR - efficiencyL) * powerR
        // Return the updated powers for both motors
        return powerL, new_r;
    }
    else {
        // Increase the power supplied to the left motor
        let new_l = powerL + (efficiencyL - efficiencyR) * powerL
        // Return the updated powers for both motors
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
        let box_position = huskylens.readeBox(1, Content1.xCenter)  // 0 
        // let MAX_POWER = power - power * height / SCREEN_HEIGHT

        // si prend tout l'écran : vitesse null
        //

        let distance_factor = height / SCREEN_HEIGHT
        let power = MAX_POWER - MAX_POWER * distance_factor;

        // Répartition de la puissance pour touner
        // si tout à gauche powerL = MAX_POWER*0/SCREEN_WIDTH = 0
        let powerL = (power * box_position / SCREEN_WIDTH);
        // si tout à droite powerR = MAX_POWER - MAX_POWER*SCREEN_WIDTH/SCREEN_WIDTH = 0
        let powerR = (power - power * box_position / SCREEN_WIDTH);

        // UTILISATION DE LA PUISSANCE + ALLUMAGE RGB
        move(powerL, powerR);
    }

    else {
        move(0, 0);
    }
}

////////// CONSTANT ////////// 

// VALUE
//const MAX_POWER = 120; // 255
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
function turnOffRobot(): void {
    temporaryDisplayMessage(MESSAGE_STOP);
    move(0, 0);
    // avoid to have a fast restart
    left_wheel_power = 0;
    right_wheel_power = 0;
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

    let seuil = MAX_POWER / 3 // car 3 couleur différentes 
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
    activate ? turnOffRobot() : turnOnRobot();
})

// IR instructions
IR.IR_callbackUser(function (msg) {
    let now = input.runningTime();

    // delay command
    if ((now - last_input_ir) > delay_input_ir) {

        if (msg == IR_ON_OFF) activate ? turnOffRobot() : turnOnRobot();
        // Add vérification option OU pas on verra
        if (activate && main_methode === METHODE_IR && isLeader) methode_ir(msg);

        last_input_ir = now;
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
            left_wheel_power += UPGRADE_SPEED_POWER;
            right_wheel_power += UPGRADE_SPEED_POWER;
            break;

        case IR_DOWN:
            left_wheel_power -= UPGRADE_SPEED_POWER;
            right_wheel_power -= UPGRADE_SPEED_POWER;
            break;

        case IR_LEFT:
            left_wheel_power -= increament_rotation;
            right_wheel_power += increament_rotation;
            break;

        case IR_RIGHT:
            left_wheel_power += increament_rotation;
            right_wheel_power -= increament_rotation;
            break;

        default: // NOTHING 
    }

    // Avoid ouOfRange int
    left_wheel_power = getBoundedValue(left_wheel_power);
    right_wheel_power = getBoundedValue(right_wheel_power);

    move(left_wheel_power, right_wheel_power);
    gradient_color_led(2, left_wheel_power);
    gradient_color_led(1, right_wheel_power);
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

const MAX_POWER = 255; // maximum value in input

// METHODE
const METHODE_IR = "IR";
const METHODE_LINE = "LINE";
const METHODE_FUNCTION = "FUNCTION";

const IR_UP = 198;
const IR_DOWN = 199;
const IR_LEFT = 200;
const IR_RIGHT = 201;
// puissance ajoutée à chaque pression d'accélération / décélération
const UPGRADE_SPEED_POWER = 50;


let left_wheel_power = 0;
let right_wheel_power = 0;
let FACTOR_ROTATION = 2 / 10; // permet à la rotation de pas être trop vioente et constante
let increament_rotation: number;

////////// DEFAULT //////////

const DEFAULT_METHODE = METHODE_IR;

////////// GLOBALES VARIABLES //////////
let main_methode = DEFAULT_METHODE;
// à l'arrêt


////////////////////////////////////////////// METHODE //////////////////////////////////////////////


////////////////////////////////////////////// INIT //////////////////////////////////////////////
radio.setGroup(RADIO_GROUP)

const delay_input_ir = 500; //millisecond  // évite de spmmer la télécommande
let last_input_ir = input.runningTime(); // date de quand le dernier input à était émis

const delay_lost_qr = 1000 // ms // évite de dire "lost" (et donc de tout stopper) à la moindre perte de contacte
let last_time_qr_visible = input.runningTime(); // date de la dernier fois ou le qr a été vu
const delay_lost_definitif = 2500 // ms

///////////////////////////////////
//////////// MAIN LOOP ////////////
///////////////////////////////////

basic.forever(function () {
    // if the robot is not the leader
    if (!isLeader) {
        // and if the robot is actived
        if (activate) {
            // the robot follow the qr code of the previous robot
            followe_qrV2();
        }
    }

    // if the robot is the leader and the robot is actived
    else if (activate) {
        // the incrementation of the rotation is calculated with the speed of the robot
        // this allow to keep the same rotation speed even if the robot is faster or slower
        increament_rotation = (left_wheel_power + right_wheel_power) * FACTOR_ROTATION;
    }
})