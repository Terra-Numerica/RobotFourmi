////////////////////////////////////////
////////////MOVING FUNCTIONS////////////
////////////////////////////////////////

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
//////////// UPDATE /////////////
/////////////////////////////////

function uptdate_ground_captor() {
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

function is_endRoad() {
    return R1 && R2 && L1 && L2
}

function update_time_outRoad() {
    // Si 1 capteur allumé et que pas all alumé
    if (is_onRoad()) { lastTime_foundRoad = input.runningTime() }
    // s'il n'est pas sur la route depuis plus de 3 secondes
    onRoad = input.runningTime() - lastTime_foundRoad < TIME_TO_BE_LOST
}

// Update all value (capt)
function update_values() {
    uptdate_ground_captor()
    update_power_search()
}


// Incrémente si nécessaire les vitesses de recherches
function update_power_search() {
    if (!onRoad) {
        // Etant la zone de recherche
        search_powerL += search_power_upgrade
        search_powerR += search_power_upgrade
    }
    else {
        // Remise à 0 des valeurs
        search_powerL = 0
        search_powerR = 30
    }
}

///////////////////////////////////////
//////////// RADIO & EVENT ////////////
///////////////////////////////////////

function launch() {
    if (!activate) {
        affichage_temporaire("R")
        activate = true
        // ne doit pas lancer les suiveurs , le fait si nécessaire dans la boucle principale

    } else {
        radio.sendString("Stop")
        affichage_temporaire("S")
        last_msg_send = "Stop"
        activate = false
        stop()
    }
}

// debute/stop le programe de parcours line puis préviens le prochain robot
input.onLogoEvent(TouchButtonEvent.Pressed, launch)

IR.IR_callbackUser(function(message: number) {
    if(message == OnOff_Button) {
        launch()
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

//////////////////////////////
//////////// MAIN ////////////
//////////////////////////////

// Fait avancer le robot selon la fuissance de recherche courante
function search_road() {

    // si perd la route, stopAll robots_suiveurs
    if (last_msg_send != "Stop") {
        basic.showString("?")
        radio.sendString("Stop")
        last_msg_send = "Stop"
    }

    basic.showString("?")
    forward(search_powerR, search_powerL)
    // backword(search_powerL, search_powerR)
}


// Avance suivant la ligne
function follow_line() {
    // // demande une updatre de la cam
    huskylens.request()
    // Si la ligne apparaît
    if (huskylens.isAppear(1, HUSKYLENSResultType_t.HUSKYLENSResultArrow)) {

        if (last_msg_send != "Run") {
            // Affiche qu'il a retrouvé la route 
            affichage_temporaire("!")
            radio.sendString("Run")
            last_msg_send = "Run"
        }

        onRoad = true
        // coord de la fleche
        let x_end = huskylens.readeArrow(1, Content2.xTarget)
        // Répartition puissance des roues
        let powerL = amortie_rotation + (power_max - amortie_rotation) * x_end / screen_width
        let powerR = amortie_rotation + power_max - power_max * x_end / screen_width
        // avance le robot
        forward(powerR, powerL)


        // backword(powerL, powerR)
        // bip boop des diodes en fonction de la puissance des roues
        gradient_color_led(2, powerL)
        gradient_color_led(1, powerR)

        // note : quand la flèche pointe à droite : actionner la roue gauche pour tourner et inversement en définsant le milieur de l'écran comme trout droite

        // Objectif : réduir l'écart

        // 2 branche pour éviter quand égalité

        if (powerR > powerL) {
            radio.sendValue("powerR", powerR * delta_power - powerR * delta_power * delta_angle)
            radio.sendValue("powerL",  powerL * delta_power * (1-delta_angle))
        }

        else if (powerL > powerR) {
            radio.sendValue("powerR", powerR * delta_power * (1-delta_angle))
            radio.sendValue("powerL", powerL * delta_power - powerL * delta_power * delta_angle)
        }

        else{
            radio.sendValue("powerR", powerR * delta_power - powerR * delta_power * delta_angle)
            radio.sendValue("powerL", powerL * delta_power - powerL * delta_power * delta_angle)

        }

        delta_angle += 0.02


    }
    else {
        // TODO: // si pas de ligne trouvé, impose qu'il soit
        onRoad = false
    }
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

///////////////////////////////
//////////// SETUP ////////////
///////////////////////////////

// VARIABLES GLOBALE

let activate = false
let onRoad = false
let last_msg_send = ""
let lastTime_foundRoad: number
// variables de recherche
let search_powerL = 0
let search_powerR = 30
let search_power_upgrade = 4

// CAPTEUR //
//True quand sur le blanc, sinon false
let L3 = false
let L2 = false
let L1 = false
let R3 = false
let R2 = false
let R1 = false

// CONSTANTE //
// durée pour être considéré comme perdu
let TIME_TO_BE_LOST = 1000
// puissance max du robot
let power_max = 100
// impose une puissance minimal pour pouvoir réduire power_max et ainsi limiter la rotation du robot
let amortie_rotation = 20
// largeur de l'écran du robot
let screen_width = 320

// delta_angle des robots_suiveurs
let delta_angle = 0
let delta_power = 2/3

let OnOff_Button = 144

// INIT //
// définie le n° du groupe de radio du robot
radio.setGroup(1)
// initialise la caméra
huskylens.initI2c()
// set la caméra en mode line tracking
huskylens.initMode(protocolAlgorithm.ALGORITHM_LINE_TRACKING)

////////////////////////////////////////////////////////////////////////
/////////////////////////////// MAIN LOOP///////////////////////////////
////////////////////////////////////////////////////////////////////////

basic.forever(function () {
    // si activate --> run
    if (activate) {
        // mis à jour des variables globales
        update_values()

        // SI atteint ligne d'arrivé stop
        if (is_endRoad()) {
            robot_turnOff()
            music.playTone(Note.C, music.beat(BeatFraction.Whole))
        }
        else {
            // si /possible, suit la route

            follow_line()

            if (!onRoad) {
                search_road()
            }
        }
    }
})
