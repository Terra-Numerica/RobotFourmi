let old_speed_l = 0;
let old_speed_r = 0;




let previousY = 0;
const vitesse_by_power = 0.387 / 2;

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
    } else {
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
        move(0, 0);
    }
    activate = !activate;
})




/**
 * Moves the robot with the given direction and power associated
 * The direction is defined by the angle given
 * The power is reparted in the wheel depending on the angle
 * @param {number} angle - The angle of the direction of the robot
 * @param {number} power - The power of the robot
 */
function move_angleDegrees(angle: number, power: number) {
    // Convert the angle to radians
    angle = angle * Math.PI / 180;

    // Calculate the left and right power using trigonometry
    // The left power is calculated using the sine of the angle plus 45 degrees
    // The right power is calculated using the cosine of the angle plus 45 degrees
    let left_power = Math.sin(angle + Math.PI / 4) * power;
    let right_power = Math.cos(angle + Math.PI / 4) * power;

    // Call the move function with the calculated powers
    // The left and right powers are passed as parameters to the move function
    move(left_power, right_power);
}

function move_angleRadian(angle: number, power: number) {
    let left_power = Math.sin(angle + Math.PI / 2) * power;
    let right_power = Math.cos(angle + Math.PI / 2) * power;
    move(left_power, right_power);

}


//const path = (x: number) => {return Math.sin(x)};
// const path = (x: number) => { return x };
const path = (x: number) => { return 10000 * Math.sin(x * 1 / 4) };


/**
 * Makes the robot follow the given path function at the given speed
 * @param {Function} path - The path function to follow
 * @param {number} speed - The speed at which to follow the path
 */
function followPath(path: (x: number) => number, speed: number) {
    // let x = 0; // Start at x = 0
    let previous_angle = 0
    // delta_angle = 0
    let x = input.runningTime() / 1000

    // Continuously calculate the angle required to follow the path and move the robot
    forever(() => {
        // Calculate the angle required to follow the path at the current x value
        let h = 0.0000001 // tend vers 0
        let slope1 = (path(x + h) - path(x)) / h;
        let slope2 = (path(x + h + h) - path(x + h)) / h;
        //console.log( slope)
        //console.logValue("path", path(x))
        // console.logValue("slope", slope1)


        // let angle = Math.atan(slope) * 180 / Math.PI;
        // let angle = Math.atan(slope) * 90 / Math.PI;
        //let angle = Math.atan(slope) * 45 / Math.PI;
        let angle = (slope1 - slope2) / ((x + h + h) - (x + h))
        let delta_angle = angle - previous_angle;
        // delta_angle = delta_angle + angle - previous_angle
        previous_angle = angle

        // Move the robot with the calculated angle and speed
        // move_angleDegrees(delta_angle, speed);
        move_angleDegrees(angle, speed);

        //console.logValue("angle ", angle)
        console.log(angle)
        // console.logValue("delta_angle", delta_angle)
        // Increment the x value
        // x += 0.1;

        x = input.runningTime() / 1000
        // console.logValue("x",x)

        // sec


        const vitesse_by_power = 0.387 / 2; // cm par sec par unit
        previous_slope = slope1

        // Pause for a short time to allow the robot to move before calculating the next angle
        //pause(10);
    });
}

let previous_slope = (path(0 + 0.01) - path(0)) / 0.01;

followPath(path, 100);


input.onButtonPressed(Button.B, function () {
    let timer = input.runningTime()
    let decal = 10
    forever(() => {
        if (input.runningTime() - timer > 5000) {
            decal = -decal
            timer = input.runningTime()
        }
        move_angleDegrees(decal, 100)
    })
})

basic.forever(function () {
    // si activate
    if (activate) {
        //follow le motif
        /*
        let power = calibration(40, 40);
        
        move(power[0], power[1]);

        
        old_speed_l = power[0];
        old_speed_r = power[1];
        */

        // move(50,50)
        //move_angle(-45, 100);
        // move_angleRadian(-10,100)


    }
})