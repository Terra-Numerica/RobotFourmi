// stop the robot mouvement and rotation
function stop() {
    DFRobotMaqueenPlus.mototStop(Motors.ALL)
}

// mouve robot forward with right speed : right(int 255), left speed : left (int 255)
function forward(right2: number, left2: number) {
    DFRobotMaqueenPlus.mototRun(Motors.M1, Dir.CW, left2)
    DFRobotMaqueenPlus.mototRun(Motors.M2, Dir.CW, right2)
}

function backword(right: number, left: number) {
    DFRobotMaqueenPlus.mototRun(Motors.M2, Dir.CCW, right)
    DFRobotMaqueenPlus.mototRun(Motors.M1, Dir.CCW, left)
}

function robot_turOff() {
    stop()
    basic.showString("Off")
    activate = false
    wheel_l = DEFAULT_POWER
    wheel_r = DEFAULT_POWER
}

input.onLogoEvent(TouchButtonEvent.Pressed, function () {
    if (activate) {
        robot_turOff()
    }
    else {
        activate = true
        basic.showString("On")
    }
})

IR.IR_callbackUser(function (message) {
    // basic.showNumber(message)
    if (activate) {
        if (message == haut) {
            wheel_l += UPGRADE_POWER
            wheel_r += UPGRADE_POWER
        }
        else if (message == bas) {

            if (wheel_l - UPGRADE_POWER > 0) {
                wheel_l -= UPGRADE_POWER
            }
            else {
                wheel_l = 0
            }

            if (wheel_r - UPGRADE_POWER > 0) {
                wheel_r -= UPGRADE_POWER
            }
            else {
                wheel_r = 0
            }
        }
        else if (message == gauche) {
            wheel_r += UPGRADE_POWER

            if (wheel_l - UPGRADE_POWER > 0) {
                wheel_l -= UPGRADE_POWER
            }
            else {
                wheel_l = 0
            }
        }
        else if (message == droite) {
            wheel_l += UPGRADE_POWER
            if (wheel_r - UPGRADE_POWER > 0) {
                wheel_r -= UPGRADE_POWER
            }
            else {
                wheel_r = 0
            }
        }

        forward(wheel_r, wheel_l)
    }

})

let POWER_MAX = 255
let DEFAULT_POWER = 1 / 10 * POWER_MAX
let UPGRADE_POWER = 25

let onOff = 129
let haut = 198
let bas = 199
let gauche = 200
let droite = 201

let activate = false
let wheel_r = DEFAULT_POWER
let wheel_l = DEFAULT_POWER

basic.forever(function () {

    if (input.acceleration(Dimension.X) > 2) {
        music.playTone(Note.C, music.beat(BeatFraction.Whole))
    }


})

/*
basic.forever(function () {
    let sonar_dist = Math.round(DFRobotMaqueenPlus.ultraSonic(PIN.P1, PIN.P2))
    // basic.showNumber(sonar_dist)
    // 10 cm
    if (activate && sonar_dist < 30) {
        robot_turOff()
        music.playTone(Note.C, music.beat(BeatFraction.Whole))
    }
}) */

