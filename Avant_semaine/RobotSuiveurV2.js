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

function cameramove() {
    huskylens.request()
    if (huskylens.isAppear(color_followed, HUSKYLENSResultType_t.HUSKYLENSResultBlock)) { // si repérage

        //CALCUL DE PUISSANCE

        // Hauteur max = environ 6/10 de l'écran ->3/5
        let height = huskylens.readeBox(1, Content1.height)
        //let widht = huskylens.readeBox(1,Content1.width) // Largeur : tou
        let rotation = huskylens.readeBox(1, Content1.xCenter)  // 0 
        //on supprime temporairement la prise ne compte de la hauteur
        // let power_max = power - power * height / max_height_y
        let power = power_max - power_max * height / max_height_y
        // Répartition de la puissance pour touner
        // si tout à gauche powerL = power_max*0/screen_width = 0
        let powerL = power * rotation / screen_width
        // si tout à droite powerR = power_max - power_max*screen_width/screen_width = 0
        let powerR = power - power * rotation / screen_width
        
        // UTILISATION DE LA PUISSANCE + ALLUMAGE RGB
        forward(powerR, powerL)
        gradient_led(1, powerR)
        gradient_led(2, powerL)


    }
    else {
        lost()
    }
}

//////////////////////////////
////////////GLOBAL////////////
//////////////////////////////

//couleur dispo à l'initialisation
//let color_dispo = [1, 2, 3, 4, 5, 6]
// couleur que suivra le robots
let color_followed: number = null
color_followed = 1
// Etat du robot
let activate = false

////////////////////////////////////
/////////////////Constante//////////
////////////////////////////////////

// puissance global répartie sur les roues
// maximum possible = 255
// une valeur + basse permet de mieux illustrer aec moins de robots
let power_max = 150
// hauteur maximal atteinte par la boite "color" sur l'écran  environ= 3/5 * 280
let max_height_y = 230
// largeur de l'écran
let screen_width = 320
// Puissance minimal pour que les roues s'active : 
let min_power_wheel = 30

/////////////////////////////
////////////SETUP////////////
/////////////////////////////

huskylens.initI2c()
huskylens.initMode(protocolAlgorithm.ALGORITHM_COLOR_RECOGNITION)
radio.setGroup(1)

////////////////////////////
////////////LOOP////////////
////////////////////////////

basic.forever(function () {
    // si activate
    if (activate) {
        //follow la couleur
        cameramove()
    }
})