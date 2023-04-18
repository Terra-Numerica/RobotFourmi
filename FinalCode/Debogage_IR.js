// Script made for easely debug IR remote control

/**
 * Print a message on the diod card 
 * @param {*} msg message printed
 * @param {*} time duration of the message, default is 0.5 seconds
 */
function affichage_temporaire(msg: string, time: number = 500): void {
    basic.showString(msg)
    control.inBackground(function () {
        basic.pause(time)
        basic.clearScreen()
    })
}

IR.IR_callbackUser(function(msg){
    affichage_temporaire(convertToText(msg));
});
