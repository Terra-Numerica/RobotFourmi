
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

input.onLogoEvent(TouchButtonEvent.Pressed, function () {
    if (activate) {
        move(0, 0);
    }
    activate = !activate;
})

let wheel_to_see = Motors1.M1;

input.onButtonPressed(Button.A, function() {
    wheel_to_see = Motors1.M1
})

input.onButtonPressed(Button.B, function () {
    wheel_to_see = Motors1.M2
})

let activate = false;

DFRobotMaqueenPlus.readSpeed(Motors1.M1)
DFRobotMaqueenPlus.readeDistance(Motors1.M1)


basic.forever(function () {
    // si activate
    if (activate) {
        //follow le motif
        let l, r = 
        move(40, 40);
    }

    let speed_val = DFRobotMaqueenPlus.readSpeed(wheel_to_see)
    affichage_temporaire(convertToText(speed_val),1500);

})