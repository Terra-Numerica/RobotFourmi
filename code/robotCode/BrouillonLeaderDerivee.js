//  const path = Math.sin(x);
/** 

Give power to the wheel
@param {number} l power of left wheel
@param {number} r  power of right wheel
@argument if value < 0 then backwards, else forward
@argument if value == 0 => stop wheels


 */
function move(l: number, r: number) {
    //  To avoid noise when low power
    if (l >= -10 && l <= 10 && r >= -10 && r <= 10) {
        DFRobotMaqueenPlus.mototStop(Motors.ALL)
    } else {
        DFRobotMaqueenPlus.mototRun(Motors.M1, l < 0 ? Dir.CCW : Dir.CW, Math.abs(l))
        DFRobotMaqueenPlus.mototRun(Motors.M2, r < 0 ? Dir.CCW : Dir.CW, Math.abs(r))
    }
    
}

/** 

Moves the robot with the given direction and power associated
The direction is defined by the angle given
The power is reparted in the wheel depending on the angle
@param {number} angle - The angle of the direction of the robot
@param {number} power - The power of the robot


 */
function move_angle(angle: number, power: number) {
    //  Convert the angle to radians
    angle = angle * Math.PI / 180
    //  Calculate the left and right power using trigonometry
    //  The left power is calculated using the sine of the angle plus 45 degrees
    //  The right power is calculated using the cosine of the angle plus 45 degrees
    let left_power = Math.sin(angle + Math.PI / 4) * power
    let right_power = Math.cos(angle + Math.PI / 4) * power
    //  Call the move function with the calculated powers
    //  The left and right powers are passed as parameters to the move function
    move(left_power, right_power)
}


let d = 90;
let plateau = 1

function f(x2: number): number {
    if (x2 % d < d / 2) {
        if (x2 % d > d / 2 - plateau) {
            return d / 2 - plateau
        }

        if (x2 % d < plateau) {
            return plateau
        }

        return x2 % d
    }

    if (x2 % d > d - plateau) {
        return plateau
    }

    if (x2 % d < d / 2 + plateau) {
        return d / 2 - plateau
    }

    return -x2 % d
}

//  def f(x):
//  return math.sin(x)
function derivee_f(x3: number): number {
    let epsilon = Math.pow(1, -6);
    let deriv = (f(x3 + epsilon) - f(x3)) / epsilon
    return deriv
}

function derivee_seconde_f(x4: number): number {
    let epsilon2 = Math.pow(1, -6);
    let deriv_seconde = (derivee_f(x4 + epsilon2) - derivee_f(x4)) / epsilon2
    return deriv_seconde
}












//  MAIN BUTTON
input.onLogoEvent(TouchButtonEvent.Pressed, function on_logo_pressed() {
    
    activate = !activate
})
let x = 0
let activate = false
let n = 500
input.onButtonPressed(Button.A, function on_button_pressed_a() {
    let v: number;
    let v2;
    let i = 0
    while (true) {
        v = 20 * -Math.sin(i*0.5)
        v2 = derivee_seconde_f(i)
        console.logValue("v", v)
        // console.logValue("v2", v2)

        move_angle(v, 75)
        
        control.waitMicros(10 ** 3 * 50)
        i += 0.05
    }
})
