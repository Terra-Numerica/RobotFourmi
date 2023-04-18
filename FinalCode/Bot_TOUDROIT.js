let old_speed_l = 0;
let old_speed_r = 0;

function calibration(powerL: number, powerR: number) {
    // Speed measure
    let speedL = DFRobotMaqueenPlus.readSpeed(Motors1.M1);
    let speedR = DFRobotMaqueenPlus.readSpeed(Motors1.M2);

    // let speedL = DFRobotMaqueenPlus.readeDistance(Motors1.M1)
    // let speedR = DFRobotMaqueenPlus.readeDistance(Motors1.M2)

    let efficiencyL = speedL / old_speed_l; // ==> vitesse obtenu par rapport à power
    // 0 = perte total , +++ = pas de perte
    let efficiencyR = speedR / old_speed_l;

    // si perte de L inférieur à perte de R
    if (efficiencyL < efficiencyR) {
        // augmenter r
        let new_r = powerR + (efficiencyR - efficiencyL) * powerR;
        return [powerL, new_r];
    } else if (efficiencyL > efficiencyR) {
        // augmenter L
        let new_l = powerL + (efficiencyL - efficiencyR) * powerL;
        return [new_l, powerR];
    } else{
        return [powerL, powerR];
    }
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

let activate = false;

input.onLogoEvent(TouchButtonEvent.Pressed, function () {
    if (activate) {
        move(10, 0);
    }
    activate = !activate;
})


basic.forever(function () {
    // si activate
    if (activate) {
        //follow le motif
        let power = calibration(40, 40);
        move(power[0], power[1]);
        old_speed_l = power[0];
        old_speed_r = power[1];
    }
})