// stop the robot mouvement and rotation
function stop() {
    DFRobotMaqueenPlus.mototStop(Motors.ALL)
}

// mouve robot forward with right speed : right(int 255), left speed : left (int 255)
function forward(right2: number, left2: number) {
    DFRobotMaqueenPlus.mototRun(Motors.M1, Dir.CW, left2)
    DFRobotMaqueenPlus.mototRun(Motors.M2, Dir.CW, right2)
}
// debute/stop le programe de parcours line puis préviens le prochain robot
input.onLogoEvent(TouchButtonEvent.Pressed, robot_turn_OnOff)

IR.IR_callbackUser(function (message: number) {
    if (message == OnOff_Button) {
        robot_turn_OnOff()
    }
})

// Affiche pendant x secondes le message
function affichage_temporaire(msg: string, time: number = 500) {
    basic.showString(msg)
    control.inBackground(function () {
        basic.pause(time)
        basic.clearScreen()
    })
}

function robot_turn_OnOff() {
    // Si déjè activer --> stop
    if (activate) {
        robot_off()
    } else {
        robot_on()
    }
}

function robot_off() {
    stop()
    affichage_temporaire("S")
    radio.sendString("Stop")
    activate = false
    music.playTone(Note.C, music.beat(BeatFraction.Whole))
    led_off()
}

function robot_on() {
    affichage_temporaire("R")
    radio.sendString("Run")
    activate = true
}


function led_off() {
    DFRobotMaqueenPlus.setRGBLight(1, Color.OFF)
    DFRobotMaqueenPlus.setRGBLight(2, Color.OFF)
}

// les diodes révelent la puissance mise dans les roues
function gradient_color_led(wheel: number, current_power: number) {

    let seuil = power_max / 3 // car 3 couleur différentes 
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

let power_max = 150


// INIT //
// définie le n° du groupe de radio du robot
radio.setGroup(1)



let delta = 0.20 * power_max
let left_wheel = 1 / 2 * power_max + delta
let right_wheel = 1 / 2 * power_max - delta

let x = 0
let courbe = Math.sin(x)
let derive = Math.cos(x)


let activate = false
let OnOff_Button = 144

let last_update = input.runningTime()
let delay = 5*1000 //secondes

function update_power_wheel() {

    if (input.runningTime() - last_update > delay ){

        music.playTone(Note.C3, music.beat(BeatFraction.Whole))

        let temp = left_wheel

        left_wheel = right_wheel
        right_wheel = temp
        
        last_update = input.runningTime()
    }
    
}

basic.forever(function () {

    // turn true si la fonction robot_turn_OnOff() lancé par bouton / IR
    if (activate) {
        // Main loop
        // Verife si sur la route
        forward(right_wheel, left_wheel)

        gradient_color_led(1, right_wheel)
        gradient_color_led(2, left_wheel)
        update_power_wheel()

    }

})




// basic.forever(function () {
//     basic.showNumber(Math.round(DFRobotMaqueenPlus.ultraSonic(PIN.P1, PIN.P2)))
// })
