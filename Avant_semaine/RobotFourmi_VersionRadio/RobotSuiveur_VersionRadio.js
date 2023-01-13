////////////////////////////////////////
////////////MOVING FUNCTIONS////////////
////////////////////////////////////////

// mouve robot forward with right speed : right(int 255), left speed : left (int 255)
function forward(right2: number, left2: number) {
    DFRobotMaqueenPlus.mototRun(Motors.M1, Dir.CW, left2)
    DFRobotMaqueenPlus.mototRun(Motors.M2, Dir.CW, right2)
}
// stop the robot mouvement and rotation
function stop() {
    DFRobotMaqueenPlus.mototStop(Motors.ALL)
}
// mouve robot backword with right speed : right(int 255), left speed : left (int 255)
function backword(right: number, left: number) {
    DFRobotMaqueenPlus.mototRun(Motors.M2, Dir.CCW, right)
    DFRobotMaqueenPlus.mototRun(Motors.M1, Dir.CCW, left)
}

///////////////////////////////////////
//////////// RADIO & EVENT ////////////
///////////////////////////////////////

// On/OFF de tous les robot --> update les autres aussi
input.onLogoEvent(TouchButtonEvent.Pressed, function () {
    if (activate) {
        robot_turnOff()
        radio.sendString("Stop")
    }
    else {
        robot_turnOn()
        radio.sendString("Run")
    }
})

function robot_turnOn() {
    activate = true
    affichage_temporaire("R")
}

function robot_turnOff() {
    activate = false
    stop()
    affichage_temporaire("S")
}

// running = update de l'état on/off
radio.onReceivedString(function (receivedString: string) {
    if (receivedString == "Run") {
        robot_turnOn()
    }
    if (receivedString == "Stop") {
        robot_turnOff()
    }
})

/////////////////////////////////
//////////// UTILITY ////////////
/////////////////////////////////

// Affiche pendant x secondes le message
function affichage_temporaire(msg: string, time: number = 500) {
    basic.showString(msg)
    control.inBackground(function () {
        basic.pause(time)
        basic.clearScreen()
    })
}

/////////////////////////////////
//////////// UTILITY ////////////
/////////////////////////////////

// s'arrête + indique qu'il est perdu
function lost() {
    stop()
    basic.clearScreen()
    basic.showString("?")
}

// les diodes révelent la puissance mise dans les roues
function gradient_led(wheel: number, current_power: number) {
    let seuil = power_max / 3 // car 3 couleur différentes 
    if (current_power <= seuil) {
        DFRobotMaqueenPlus.setRGBLight(wheel, Color.RED)
    }
    else if (current_power <= 2 * seuil) {
        DFRobotMaqueenPlus.setRGBLight(wheel, Color.GREEN)
    }
    else if (current_power <= 3 * seuil) {
        DFRobotMaqueenPlus.setRGBLight(wheel, Color.BLUE)
    }

}

//////////////////////////////
//////////// MAIN ////////////
//////////////////////////////


function follow(wheel: number, power: number) {
    DFRobotMaqueenPlus.mototRun(wheel, Dir.CW, power)
    gradient_led(wheel, power)
}

radio.onReceivedValue(function (name: string, value: number) {
    if (name == "powerL") follow(1, value)
    if (name == "powerR") follow(2, value)
})

//////////////////////////////
////////////GLOBAL////////////
//////////////////////////////

// Etat du robot
let activate = false

////////////////////////////////////
/////////////////Constante//////////
////////////////////////////////////

let power_max = 150


/////////////////////////////
////////////SETUP////////////
/////////////////////////////

radio.setGroup(1)
