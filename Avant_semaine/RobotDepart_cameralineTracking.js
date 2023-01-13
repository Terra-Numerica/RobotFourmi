// NOTES : DO NOT WORK FOR THE MOMENT

////////////MOVING FUNCTIONS////////////

// mouve robot backword with right speed : right(int 255), left speed : left (int 255)
function backword(right: number, left: number) {
    DFRobotMaqueenPlus.mototRun(Motors.M2, Dir.CCW, right)
    DFRobotMaqueenPlus.mototRun(Motors.M1, Dir.CCW, left)
}
// stop the robot mouvement and rotation
function stop() {
    DFRobotMaqueenPlus.mototStop(Motors.ALL)
}
// mouve robot forward with right speed : right(int 255), left speed : left (int 255)
function forward(right2: number, left2: number) {
    DFRobotMaqueenPlus.mototRun(Motors.M1, Dir.CW, left2)
    DFRobotMaqueenPlus.mototRun(Motors.M2, Dir.CW, right2)
}

//////////// UTILITY ////////////

// Affiche pendant x secondes le message
function affichage_temporaire(msg: string, time: number = 500) {
    basic.showString(msg)
    control.inBackground(function () {
        basic.pause(time)
        basic.clearScreen()
    })
}

//////////// UPDATE ////////////

function uptdate_lineTracker() {
    // Update value capteur
    R1 = DFRobotMaqueenPlus.readPatrol(Patrol.R1) == 1
    R2 = DFRobotMaqueenPlus.readPatrol(Patrol.R2) == 1
    R3 = DFRobotMaqueenPlus.readPatrol(Patrol.R3) == 1
    L1 = DFRobotMaqueenPlus.readPatrol(Patrol.L1) == 1
    L2 = DFRobotMaqueenPlus.readPatrol(Patrol.L2) == 1
    L3 = DFRobotMaqueenPlus.readPatrol(Patrol.L3) == 1
}

function update_timeRoad() {

    if (R1 || R2 || R3 || L1 || L2 || L3) {
        lastTime_foundRoad = input.runningTime()
    }
    // s'il n'est pas sur la route depuis plus de 3 secondes
    // let before = onRoad

    onRoad = input.runningTime() - lastTime_foundRoad < TIME_TO_BE_LOST
    //S'il était sur la route est qu'il vient de la perdre
    // if (before && !onRoad) { // préviens les robots_suiveurs
    //     radio.sendString("Stop")
    // }
    // //s'il vient de trouver la route 
    // if(!before && onRoad){
    //     radio.sendString("Run")
    // }
}

//Update les valeurs issues des capteurs
function update_values() {
    uptdate_lineTracker()
    update_timeRoad()
}

//////////// MAIN ////////////

// recherche le trait noir en faisant des tours de + en + grand
function searchRoad() {
    // vitesse lors de la recherche
    let powerR = 40
    // vitesse lors de la recherche
    let powerL = 20
    // écart de puissance entre les 2 roues
    let delta = 20
    // augmentation de la puissance / réduction de l'écrat proportionnel entre les roues
    let upgrade = 4
    uptdate_lineTracker()
    // search path
    let isFound = R1 || R2 || R3 || L1 || L2 || L3
    // boucle while par facilité
    while (!(isFound)) {
        basic.showString("?")
        forward(powerR, powerL - delta)
        // réduit l'écart proportionnel entre les 2 roues sans le réduir à zéro
        powerR += upgrade
        powerL += upgrade

        uptdate_lineTracker()

        // search path
        isFound = R1 || R2 || R3 || L1 || L2 || L3
    }
    affichage_temporaire("!")
    onRoad = true
    lastTime_foundRoad = input.runningTime()

    // //Préviens les robots_suiveurs qu'ils peuvent le suivre
    // radio.sendString("Run")
}





function moveLineV2(){

    if (huskylens.isAppear(1, HUSKYLENSResultType_t.HUSKYLENSResultArrow)){
        onRoad = true
        //let x_start = huskylens.readeArrow(1, Content2.xOrigin)
        //let y_start = huskylens.readeArrow(1, Content2.yOrigin)
        // coord de la fleche
        let x_end = huskylens.readeArrow(1, Content2.xTarget)
        //let y_end = huskylens.readeArrow(1, Content2.yTarget)

        let powerL = power * x_end / screen_width
        let powerR = power - power * x_end / screen_width
        music.playTone(Note.C, music.beat(BeatFraction.Whole))
        forward(powerR,powerL)

        gradient_ledV2(2, powerL)
        gradient_ledV2(1, powerR)

        // note : quand la flèche pointe à droite : actionner la roue gauche pour tourner et inversement en définsant le milieur de l'écran comme trout droite
    }

    else{
        onRoad = false
    }

}


// les diodes révelent la puissance mise dans les roues
function gradient_ledV2(wheel: number, current_power: number) {
    let seuil = power / 3 // car 3 couleur différentes 

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







// permet de suivre une ligne grace au sensor distribution R3 R2 R1 L1 L2 L3 si readPatrol == 1 signifie au dessus de ligne noire
function moveLine() {
    if (L1 && R1) {
        forward(100, 100)
    } else if (!(L2) && L1 && !(R1)) {
        forward(100, 80)
    } else if (L2 && L1) {
        forward(110, 60)
    } else if (L2 && !(L1)) {
        forward(110, 30)
    } else if (L3) {
        forward(120, 30)
    } else if (!(R2) && !(L1) && R1) {
        forward(80, 100)
    } else if (R2 && R1) {
        forward(60, 110)
    } else if (R2 && !(R1)) {
        forward(30, 110)
    } else if (R3) {
        forward(30, 120)
    }
}

// permet de stoper le robot lorsque le symbole stop est recue est d'envoier un stop au prochain robots
function qrCodeSwitch() {
    huskylens.request()
    if (huskylens.isAppear(1, HUSKYLENSResultType_t.HUSKYLENSResultBlock)) {
        music.playTone(Note.C, music.beat(BeatFraction.Whole))
        robot_turnOff()
        radio.sendString("Stop")
        last_msg_send = "Stop"
    }
}


//////////// RADIO & EVENT ////////////

// debute/stop le programe de parcours line puis préviens le prochain robot
input.onLogoEvent(TouchButtonEvent.Pressed, function () {
    if (!activate) {
        affichage_temporaire("Run")
        activate = true
        // ne doit pas lancer les suiveurs , le fait si nécessaire dans la boucle principale

    } else {
        affichage_temporaire("S")
        activate = false
        radio.sendString("Stop")
        last_msg_send = "Stop"
        stop()
    }
})

// pour facilité l'arret simultané de tout les robots

radio.onReceivedString(function (receivedString: string) {
    if (receivedString == "Run") {
        robot_turnOn()
    }
    if (receivedString == "Stop") {
        robot_turnOff()
    }
})

function robot_turnOn() {
    activate = true
    affichage_temporaire("R")
}

function robot_turnOff() {
    activate = false
    affichage_temporaire("R")
    stop()
}

/*

// On/OFF de tous les robot
input.onLogoEvent(TouchButtonEvent.Pressed, function () {
    activate ? robot_turnOff() : robot_turnOn()
    activate = !activate
})

function robot_turnOn () {
    activate = true
    radio.sendString("Run")
    affichage_temporaire("R")
}

function robot_turnOff () {
    activate = false
    radio.sendString("Stop")
    affichage_temporaire("S")
    stop()
}
*/

/**
 * Ce program est concue pour le premier robot.
 * 
 * Cellui suit une route déssiné au sol pour demarée le programe on apuis sur le logo sur la carte ce qui le activate.
 */


//////////// SETUP ////////////

let activate = false
let onRoad = false
let last_msg_send = ""

//capteur
//True quand sur le blanc, sinon false
let L3 = false
let L2 = false
let L1 = false
let R3 = false
let R2 = false
let R1 = false

/////////////////Constante//////////
// puissance global répartie sur les roues : 250
let power = 255 // maximum possible = 255
// largeur de l'écran
let screen_width = 320
// Puissance minimal pour que les roues s'active : 
let min_power_wheel = 30


// Constante
// durée pour être considéré comme perdu
let TIME_TO_BE_LOST = 1500
// color du robot de départ
let my_color = Color.RED

let lastTime_foundRoad: number
radio.setGroup(1)
huskylens.initI2c()
//huskylens.initMode(protocolAlgorithm.ALGORITHM_TAG_RECOGNITION)
huskylens.initMode(protocolAlgorithm.ALGORITHM_LINE_TRACKING)

//////////// LOOP ////////////
// Main loop des robots: verifie stade activé, si premier robot parcours line si non suit par camera.
basic.forever(function () {
    if (activate) {
        //update_values()
        // qrCodeSwitch()
        // TEST
        moveLineV2()
        if (onRoad) {
            if (last_msg_send != "Run") {
                radio.sendString("Run")
                last_msg_send = "Run"
            }
            //moveLine()
        } else if (!onRoad) {
            // si perd la route, stopAll robots_suiveurs
            if (last_msg_send != "Stop") {
                radio.sendString("Stop")
                last_msg_send = "Stop"
            }
            //searchRoad()

        }

        // qrCodeSwitch()
    }
})
