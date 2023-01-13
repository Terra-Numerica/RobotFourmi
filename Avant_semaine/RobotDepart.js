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


// Considérer comme sur la route si au moins 1 est allumé et qu'ils sont pas tous allumé en même temps
function is_onRoad() {
    return (R1 || R2 || R3 || L1 || L2 || L3) && !(R1 && R2 && R3 && L1 && L2 && L3)
}

function update_timeRoad() {
    // Si 1 capteur allumé et que pas all alumé
    if (is_onRoad()) { lastTime_foundRoad = input.runningTime() }
    // s'il n'est pas sur la route depuis plus de 3 secondes
    onRoad = input.runningTime() - lastTime_foundRoad < TIME_TO_BE_LOST
}

//Update les valeurs issues des capteurs
function update_values() {
    uptdate_lineTracker()
    update_timeRoad()
}

function update_valuesV2() {
    uptdate_lineTracker()
    update_timeRoad()
    update_power_search()
}

function update_power_search() {
    if (!onRoad) {
        // Etant la zone de recherche
        search_powerL += search_power_upgrade
        search_powerR += search_power_upgrade
    }
    else {
        // Remise à 0 des valeurs
        search_powerL = 10
        search_powerR = 30
    }
}

//////////// MAIN ////////////

function search_road() {
    basic.showString("?")
    forward(search_powerR, search_powerL)
}

function moveLine_lineTracking(){
    
}


// permet de suivre une ligne grace au sensor distribution R3 R2 R1 L1 L2 L3 si readPatrol == 1 signifie au dessus de ligne noire
function moveLine() {
    if (L1 && R1) {
        // forward(100, 100)
        forward(80, 80)
    } else if (!(L2) && L1 && !(R1)) {
        // forward(100, 80)
        forward(80, 60)
    } else if (L2 && L1) {

        //forward(110, 60)
        forward(90, 40)
    } else if (L2 && !(L1)) {
        // forward(90, 10)
        forward(110, 30)
    } else if (L3) {
        // forward(120, 30)
        forward(100, 10)
    } else if (!(R2) && !(L1) && R1) {
        // forward(80, 100)
        forward(60, 80)
    } else if (R2 && R1) {
        //forward(60, 110)
        forward(40, 90)
    } else if (R2 && !(R1)) {
        // forward(30, 110)
        forward(10, 90)
    } else if (R3) {
        // forward(30, 120)
        forward(10, 100)
    }
}

// permet de stoper le robot lorsque le symbole stop est recue est d'envoier un stop au prochain robots
function qrCodeSwitch() {
    huskylens.initMode(protocolAlgorithm.ALGORITHM_TAG_RECOGNITION)
    huskylens.request()
    if (huskylens.isAppear(1, HUSKYLENSResultType_t.HUSKYLENSResultBlock)) {
        robot_turnOff()
        radio.sendString("Stop")
        last_msg_send = "Stop"
        // playTone placé à la fin car potentielement bloquant
        music.playTone(Note.C, music.beat(BeatFraction.Whole))
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
        stop()
        radio.sendString("Stop")
        affichage_temporaire("S")
        last_msg_send = "Stop"
        activate = false


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

// Constante
// durée pour être considéré comme perdu
let TIME_TO_BE_LOST = 1000
// color du robot de départ
let my_color = Color.RED

let lastTime_foundRoad: number
radio.setGroup(1)
huskylens.initI2c()


//////////// LOOP ////////////
// Main loop des robots: verifie stade activé, si premier robot parcours line si non suit par camera.
/*
basic.forever(function () {
    if (activate) {
        update_values()
        if (onRoad) {
            if (last_msg_send != "Run") {
                radio.sendString("Run")
                last_msg_send = "Run"
            }
            moveLine()
        } else if (!onRoad) {
            // si perd la route, stopAll robots_suiveurs
            if (last_msg_send != "Stop") {
                radio.sendString("Stop")
                last_msg_send = "Stop"
            }
            searchRoad()

        }

        qrCodeSwitch()
    }
})
*/

// MAIN V2 USE is_onRoad()

//use constante histoire d'éviter des calculs inutiles

let search_powerL = 20
let search_powerR = 40
let search_power_upgrade = 4

basic.forever(function () {
    if (activate) {
        update_valuesV2()
        if (onRoad) {
            if (last_msg_send != "Run") {
                // Affiche qu'il a retrouvé la route 
                affichage_temporaire("!")
                radio.sendString("Run")
                last_msg_send = "Run"
            }
            moveLine()
        } else if (!onRoad) {
            // si perd la route, stopAll robots_suiveurs
            if (last_msg_send != "Stop") {
                basic.showString("?")
                radio.sendString("Stop")
                last_msg_send = "Stop"
            }
            searchRoadV2()

        }

        qrCodeSwitch()
    }
})
