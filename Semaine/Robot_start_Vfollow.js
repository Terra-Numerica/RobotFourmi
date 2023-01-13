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

function update_road() {
    // Si 1 capteur allumé et que pas all allumé
    if (is_onRoad()) { lastTime_foundRoad = input.runningTime() }
    // s'il n'est pas sur la route depuis plus de 3 secondes

    if (input.runningTime() - lastTime_foundRoad > TIME_TO_BE_LOST
        || is_endRoad()) {
        robot_off()
    }

}

// Update all value (capt)
function update_values() {
    uptdate_ground_captor()
    update_road()
}

function line_arrow_methode() {

    // // demande une updatre de la cam
    huskylens.request()
    // Si la ligne apparaît
    if (huskylens.isAppear(1, HUSKYLENSResultType_t.HUSKYLENSResultArrow)) {
        // coord de la fleche
        let x_end = huskylens.readeArrow(1, Content2.xTarget)
        // Power
        let powerL = power_max * amortie_rotation + (1 - amortie_rotation) * power_max * x_end / screen_width
        let powerR = power_max - power_max * x_end / screen_width * amortie_rotation

        forward(powerR, powerL)
        gradient_color_led(2, powerL)
        gradient_color_led(1, powerR)

        // note : quand la flèche pointe à droite : actionner la roue gauche pour tourner et inversement en définsant le milieur de l'écran comme trout droite
    }
    else {
        DFRobotMaqueenPlus.setRGBLight(2, Color.RED)
    }
}

function line_captor_methode() {

    if(L1 && !R1){
        forward(4 / 10 * power_max, 6 / 10 * power_max)
    } else if(!L1 && R1){
        forward(6/ 10 * power_max, 4/ 10 * power_max)
    }
    if (L1 || R1) {
        forward(1 / 2 * power_max, 1 / 2 * power_max)
        return true
    } else if (L2) {
        forward(7 / 10 * power_max, 3 / 10 * power_max)
        return true
    } else if (R2) {
        forward(3 / 10 * power_max, 7 / 10 * power_max)
        return true
    }
    return false
}

// Avance suivant la ligne
function follow_line() {

    if (!line_captor_methode()) {
        // Si échoue, alors use méthode arrow
        line_arrow_methode()
    }

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

///////////////////////////////
//////////// SETUP ////////////
///////////////////////////////

// VARIABLES GLOBALE
let activate = false

let lastTime_foundRoad = input.runningTime()


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
let TIME_TO_BE_LOST = 2000
// puissance max du robot
let power_max = 100
let amortie_rotation = 0.25
// largeur de l'écran du robot
let screen_width = 320
let OnOff_Button = 144


// INIT //
// définie le n° du groupe de radio du robot
radio.setGroup(1)
// initialise la caméra
huskylens.initI2c()
// set la caméra en mode line tracking
huskylens.initMode(protocolAlgorithm.ALGORITHM_LINE_TRACKING)


basic.forever(function () {

    // turn true si la fonction robot_turn_OnOff() lancé par bouton / IR
    if (activate) {
        // Main loop
        // Verife si sur la route 

        follow_line()
        update_values()

    }

})
