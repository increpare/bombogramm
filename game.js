
var canvas = document.getElementById('game');
// get canvas context
var ctx = canvas.getContext('2d');
// load image

var solutionstate = {
    width: 8,
    height: 8,
    smallbombs: [],//list of coordinates
    bigbombs: [],
    rowmask: [],
    colmask: [],
}

var playstate = {
    width:8,
    height:8,
    smallbombs: [],//list of coordinates
    bigbombs: [],
    rowmask: [],
    colmask: [],
    rowmask_state: [],//-1,0,1 bad neutral good
    colmask_state: [],//-1,0,1 bad neutral good
    won:false,
}

function validateMasks(solution,currentstate){
    calculateMasks(currentstate);
    //for each row, check you haven't exceeded the number of bombs
    for (var i=0;i<solution.rowmask.length;i++){
        playstate.rowmask_state[i] = Math.sign(solution.rowmask[i]-currentstate.rowmask[i]);
    }
    for (var i=0;i<solution.colmask.length;i++){
        playstate.colmask_state[i] = Math.sign(solution.colmask[i]-currentstate.colmask[i]);
    }
    //check if all are good
    var waswon = playstate.won;
    playstate.won = true;
    for (var i=0;i<solution.rowmask.length;i++){
        if (playstate.rowmask_state[i] !== 0){
            playstate.won = false;
            break;
        }
    }
    for (var i=0;i<solution.colmask.length;i++){
        if (playstate.colmask_state[i] !== 0){
            playstate.won = false;
            break;
        }
    }
    //check no cells empty
    for (var i=0;i<solution.width;i++){
        for (var j=0;j<solution.height;j++){
            if (getCell(currentstate,i,j)===0){
                playstate.won = false;
                break;
            }
        }
    }

    if (!waswon && playstate.won){
        playSound(32947700);
    }
}

function getCell(state, x, y) {
    //return 0 = nothing there
    //return 1 = small bomb
    //return 2,3,4,5 = big bomb (NW,NE,SW,SE parts respectively)
    for (var i = 0; i < state.smallbombs.length; i++) {
        if (state.smallbombs[i][0] === x && state.smallbombs[i][1] === y) {
            return 1;
        }
    }
    for (var i = 0; i < state.bigbombs.length; i++) {
        if (state.bigbombs[i][0] === x && state.bigbombs[i][1] === y) {
            return 2;
        }
        if (state.bigbombs[i][0] + 1 === x && state.bigbombs[i][1] === y) {
            return 3;
        }
        if (state.bigbombs[i][0] === x && state.bigbombs[i][1] + 1 === y) {
            return 4;
        }
        if (state.bigbombs[i][0] + 1 === x && state.bigbombs[i][1] + 1 === y) {
            return 5;
        }
    }
    return 0;
}

function generateSolution(w, h) {
    var result = {
        width: w,
        height: h,
        smallbombs: [],//list of coordinates
        bigbombs: [],
    }

    //for a grid with N cells, try place n/2 big bombs
    const CELL_COUNT = result.width * result.height;
    const BOMB_PLACEMENT_ATTEMPTS = Math.floor(CELL_COUNT / 1.0);
    for (var i = 0; i < BOMB_PLACEMENT_ATTEMPTS; i++) {
        var x = Math.floor(Math.random() * (result.width - 1));
        var y = Math.floor(Math.random() * (result.height - 1));
        var cells = [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]];
        //check if there's already a big bomb overlapping these four cells
        var overlap = false;
        for (var j = 0; j < cells.length; j++) {
            if (getCell(result, cells[j][0], cells[j][1]) > 1) {
                overlap = true;
                break;
            }
        }
        if (!overlap) {
            result.bigbombs.push([x, y]);
        }
    }

    //wherever there isn't a big bomb, place a little bomb
    for (var x = 0; x < result.width; x++) {
        for (var y = 0; y < result.height; y++) {
            if (getCell(result, x, y) === 0) {
                result.smallbombs.push([x, y]);
            }
        }
    }

    calculateMasks(result);
    return result;
}

function calculateMasks(result) {
    result.rowmask = [];
    result.colmask = [];
    for (var i = 0; i < result.width; i++) {
        //count number of bombs in row
        //basically, count little bombs as worth 2, and then half at the end
        var bombcount_double = 0;
        for (var j = 0; j < result.height; j++) {
            var cellcontents = getCell(result, i, j);
            if (cellcontents === 1) {
                bombcount_double += 2;
            } else if (cellcontents>1) {
                bombcount_double += 1;
            }
        }
        const bombcount = bombcount_double / 2;
        result.colmask.push(bombcount);
    }
    for (var j = 0; j < result.height; j++) {
        //count number of bombs in row
        //basically, count little bombs as worth 2, and then half at the end
        var bombcount_double = 0;
        for (var i = 0; i < result.width; i++) {
            var cellcontents = getCell(result, i, j);
            if (cellcontents === 1) {
                bombcount_double += 2;
            } else if (cellcontents>1){
                bombcount_double += 1;
            }
        }
        const bombcount = bombcount_double / 2;
        result.rowmask.push(bombcount);
    }
}

function stateToASCII(state) {
    var result = "";
    //first line is space followed by colmasks
    result += "   ";
    for (var i = 0; i < state.colmask.length; i++) {
        result += state.colmask[i].toString().padStart(3, " ");
    }
    //each subseuqnt row is a rowmask followed by the row o for little bomb X for big bomb
    for (var i = 0; i < state.rowmask.length; i++) {
        //format rowmast to 2 digits
        result += "\n" + state.rowmask[i].toString().padStart(3, " ");
        for (var j = 0; j < state.colmask.length; j++) {
            var cell = getCell(state, j, i);
            result += cell.toString().padStart(3, " ");
            // if (cell===1){
            //     result+="o";
            // } else {
            //     result+="X";
            // }
        }
        result += "\n";
    }
    return result;
}


var cw = canvas.width;
var ch = canvas.height;

function reOffset() {
    var BB = canvas.getBoundingClientRect();
    offsetX = BB.left;
    offsetY = BB.top;

    cw = canvas.width;
    ch = canvas.height;
}

var offsetX, offsetY;
reOffset();


window["onscroll"] = function (e) { reOffset(); }
window["onresize"] = function (e) { reOffset(); }


var alpha_masks = [];
var images = [];


var image_names = [
    "background",
    "digit0",
    "digit1",
    "digit2",
    "digit3",
    "digit4",
    "digit5",
    "digit6",
    "digit7",
    "digit8",
    "digitbg_white",
    "digitbg_red",
    "digitbg_green",
    "stufe_button",
    "stufe_button_pressed",
    "led_off",
    "led_on",
    "gewinnnachricht1",
    "gewinnnachricht2",
    "gewinnnachricht3",
    "gewinnnachricht4",
    "gewinnnachricht5",
    "schalter_an",
    "schalter_aus",
    "sfx_on",
    "sfx_on_pressed",
    "sfx_off",
    "sfx_off_pressed",
    "led_off",
    "led_on",
    "button_tl",
    "button_tl_pressed",
    "button_t",
    "button_t_pressed",
    "button_tr",
    "button_tr_pressed",
    "button_r",
    "button_r_pressed",
    "button_br",
    "button_br_pressed",
    "button_b",
    "button_b_pressed",
    "button_bl",
    "button_bl_pressed",
    "button_l",
    "button_l_pressed",
    "grid_button_diamond",
    "grid_button_diamond_pressed",
    "grid_button_plus",
    "grid_button_plus_pressed",
    "mine_big",
    "mine_big_pressed",
    "mine_small",
    "mine_small_pressed",
    "screen_on_bg"
];


var loadedImages = 0;

var temp_canvas = document.createElement("canvas");
temp_canvas.style.display = 'none';
var temp_ctx = temp_canvas.getContext("2d");

for (var i = 0; i < image_names.length; i++) {
    var image = new Image();
    image.onload = function (INDEX, IMAGE) {
        return function (e) {
            //if all loaded
            if (++loadedImages >= image_names.length) {
                // draw the image into the canvas
                redraw();
            }


            //now calculate alpha mask of image
            var mask = [];

            temp_canvas.width = IMAGE.width;
            temp_canvas.height = IMAGE.height;
            //clear image
            temp_ctx.clearRect(0, 0, temp_canvas.width, temp_canvas.height);
            temp_ctx.drawImage(IMAGE, 0, 0);
            var imgData = temp_ctx.getImageData(0, 0, temp_canvas.width, temp_canvas.height);
            var data = imgData.data;
            for (var j = 0; j < data.length; j += 4) {
                mask.push(data[j + 3] > 0);
            }
            alpha_masks[image_names[INDEX]] = mask;

            //pretty print mask data
            var maskdata_str = image_names[INDEX] + "\n";
            for (var j = 0; j < mask.length; j++) {
                maskdata_str += mask[j] ? "1" : "0";
                if ((j + 1) % IMAGE.width === 0) {
                    maskdata_str += "\n";
                }
            }
            console.log(maskdata_str);

        }
    }(i, image);
    image.src = "imgs/" + image_names[i] + ".png";
    images[image_names[i]] = image;

}

var stufe = 0;

var interface_an = false;

function button_sfx_on() {
    muted=true;
	playSound(4159307);
    clickable_buttons[0][7] = false;
    clickable_buttons[1][7] = true;
    redraw();
}
function button_sfx_off() {
    muted=false;
    clickable_buttons[0][7] = true;
    clickable_buttons[1][7] = false;
    redraw();
}

function button_stufe() {
    if (interface_an){
        playSound(4159307);
        stufe = (stufe + 1) % 5;    
        regenLevel();
        redraw();
    }
}

function bombbutton_click_callback(x, y, big){
    return function(){
        playSound(4457707);
        //remove bomb from playstate
        if (big){
            for (var i = 0; i < playstate.bigbombs.length; i++) {
                if (playstate.bigbombs[i][0] === x && playstate.bigbombs[i][1] === y) {
                    playstate.bigbombs.splice(i, 1);
                    break;
                }
            }
        } else {
            for (var i = 0; i < playstate.smallbombs.length; i++) {
                if (playstate.smallbombs[i][0] === x && playstate.smallbombs[i][1] === y) {
                    playstate.smallbombs.splice(i, 1);
                    break;
                }
            }
        }
        
        calculateMasks(playstate);
        validateMasks(solutionstate,playstate);
        generateLevelButtons();
        redraw();
    }
}


function gridbutton_click_callback(x, y, big){
    return function(){
        playSound(4457707);
        console.log("clicked",x,y,big);
        if (big){
            playstate.bigbombs.push([x,y]);
        } else {
            playstate.smallbombs.push([x,y]);
        }

        calculateMasks(playstate);
        validateMasks(solutionstate,playstate);
        generateLevelButtons();
        redraw();
    }
}

function generateLevelButtons(){
    //step one, clear all clikable buttons
    //remove all entries from clickable_buttons to reduce its legnth to CLICKABLE_BUTTONS_CORECOUNT
    clickable_buttons.splice(CLICKABLE_BUTTONS_CORECOUNT);

    if (interface_an===false){
        return;
    }

    //step two, add new buttons
    for (var i = 0; i < solutionstate.width; i++) {
        for (var j = 0; j < solutionstate.height; j++) {
            cellcontents = getCell(playstate, i, j);
            if (cellcontents === 0) {
                // [ ID, x, y, img, img_pressed, current_state, callback, visible]
                var button_id = "cell_" + i + "_" + j;
                var button_x = 15 + i * 14;
                var button_y = 38 + j * 14;
                var button_img_name = "grid_button_diamond";
                if (i===0 && j===0){
                    //top left
                    button_img_name = "button_tl";
                } else if (i===solutionstate.width-1 && j===0){
                    //top right
                    button_img_name = "button_tr";
                } else if (i===0 && j===solutionstate.height-1){
                    //bottom left
                    button_img_name = "button_bl";
                }
                else if (i===solutionstate.width-1 && j===solutionstate.height-1){
                    //bottom right
                    button_img_name = "button_br";
                } else if (i===0){
                    //left
                    button_img_name = "button_l";
                }
                else if (i===solutionstate.width-1){
                    //right
                    button_img_name = "button_r";
                }
                else if (j===0){
                    //top
                    button_img_name = "button_t";
                }
                else if (j===solutionstate.height-1){
                    //bottom
                    button_img_name = "button_b";
                }

                var button_img_pressed_name =button_img_name+"_pressed";

                var button_current_state = false;
                var button_callback = gridbutton_click_callback(i, j, false);
                var button_visible = interface_an;
                clickable_buttons.push([button_id, button_x, button_y, button_img_name, button_img_pressed_name, button_current_state, button_callback, button_visible]);            

                if( getCell(playstate, i+1, j) === 0 && 
                getCell(playstate, i, j+1) === 0 && 
                getCell(playstate, i+1, j+1)=== 0 ) {
                    //now to generate the big bomb buttons, squidged between the small bomb buttons
                    if (i<solutionstate.width-1 && j<solutionstate.height-1){
                        var button_id = "cell_big_" + i + "_" + j;
                        var button_x = 15 + i * 14 + 7;
                        var button_y = 38 + j * 14 + 7;
                        var button_img_name = "grid_button_plus";
                        var button_img_pressed_name = button_img_name+"_pressed";
                        var button_current_state = false;
                        var button_callback = gridbutton_click_callback(i, j, true);
                        var button_visible = interface_an;
                        clickable_buttons.push([button_id, button_x, button_y, button_img_name, button_img_pressed_name, button_current_state, button_callback, button_visible]);            
                    }
                }
            } else if (cellcontents===1){
                //draw small bomb button
                var button_id = "cell_" + i + "_" + j;
                var button_x = 15 + i * 14;
                var button_y = 38 + j * 14;
                var button_img_name = "mine_small";
                var button_img_pressed_name = "mine_small_pressed";
                var button_current_state = false;
                var button_callback = bombbutton_click_callback(i, j, false);
                var button_visible = interface_an;
                clickable_buttons.push([button_id, button_x, button_y, button_img_name, button_img_pressed_name, button_current_state, button_callback, button_visible]);
            } else if (cellcontents ===2){
                //draw big bomb button
                var button_id = "cell_big_" + i + "_" + j;
                var button_x = 15 + i * 14;
                var button_y = 38 + j * 14;
                var button_img_name = "mine_big";
                var button_img_pressed_name = "mine_big_pressed";
                var button_current_state = false;
                var button_callback = bombbutton_click_callback(i, j, true);
                var button_visible = interface_an;
                clickable_buttons.push([button_id, button_x, button_y, button_img_name, button_img_pressed_name, button_current_state, button_callback, button_visible]);                
            }
        }
    }
    
}

//regenlevel doesn't call redraw - you have to do that yourself
function regenLevel(){
    const dimension = stufe+4;
    
    solutionstate = generateSolution(dimension, dimension);
    playstate = {
        width:dimension,
        height:dimension,
        smallbombs: [],//list of coordinates
        bigbombs: [],
        rowmask: [],
        colmask: [],
        rowmask_state: [],
        colmask_state: [],
        won:false,
    };
    
    validateMasks(solutionstate,playstate);

    console.log(stateToASCII(solutionstate));

    generateLevelButtons();
}

function button_interface_an(){
    //turn off
    interface_an=false;
    generateLevelButtons();
    redraw();
}

function button_interface_aus(){
    //turn on

	playSound(4159307);
    interface_an=true;
    regenLevel();
    redraw();

}
var clickable_buttons = [
    // [ ID, x, y, img, img_pressed, current_state, callback, visible]
    ["sfx_on", 135, 45, "sfx_on", "sfx_on_pressed", false, button_sfx_on, true],
    ["sfx_off", 135, 45, "sfx_off", "sfx_off_pressed", false, button_sfx_off, false],
    ["stufe_button", 137, 67, "stufe_button", "stufe_button_pressed", false, button_stufe, true],
];
const CLICKABLE_BUTTONS_CORECOUNT = clickable_buttons.length;

function redraw() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    //draw background
    ctx.drawImage(images["background"], 0, 0);

    if (interface_an) {
        ctx.drawImage(images["schalter_an"], 130, 32);
        ctx.drawImage(images["led_on"], 147, 33);
    } else {
        ctx.drawImage(images["schalter_aus"], 130, 32);
        ctx.drawImage(images["led_off"], 147, 33);
    }

    if (interface_an){
        ctx.drawImage(images["screen_on_bg"], 14, 37);
    }
    //draw buttons
    for (var i = 0; i < clickable_buttons.length; i++) {
        var button = clickable_buttons[i];
        if (button[7] === false) {//if not visible
            continue;
        }
        if (button[5]) {//if pressed
            ctx.drawImage(images[button[4]], button[1], button[2]);
        } else {
            ctx.drawImage(images[button[3]], button[1], button[2]);
        }
    }

    for (var i = 0; i < 5; i++) {
        var led_x = 138;
        var led_y = 79 + i * 9;
        var led_an = interface_an && i <= stufe;
        if (led_an) {
            ctx.drawImage(images["led_on"], led_x, led_y);
        } else {
            ctx.drawImage(images["led_off"], led_x, led_y);
        }
    }

    //draw masks
    if (interface_an){
        for (var i = 0; i < solutionstate.width; i++) {
            switch (playstate.colmask_state[i]){
                case -1:
                    ctx.drawImage(images["digitbg_red"], 18 + i * 14, 27);
                    break;
                case 0:
                    ctx.drawImage(images["digitbg_green"], 18 + i * 14, 27);
                    break;
                case 1:
                    ctx.drawImage(images["digitbg_white"], 18 + i * 14, 27);
                    break;
            }
            ctx.drawImage(images["digit" + solutionstate.colmask[i]], 18 + i * 14, 27);
        }
        for (var i = 0; i < solutionstate.height; i++) {
            switch (playstate.rowmask_state[i]){
                case -1:
                    ctx.drawImage(images["digitbg_red"], 4, 41 + i * 14);
                    break;
                case 0:
                    ctx.drawImage(images["digitbg_green"], 4, 41 + i * 14);
                    break;
                case 1:
                    ctx.drawImage(images["digitbg_white"], 4, 41 + i * 14);
                    break;
            }
            ctx.drawImage(images["digit" + solutionstate.rowmask[i]], 4, 41 + i * 14);
        }    
    }

    if (interface_an && playstate.won){
        ctx.drawImage(images["gewinnnachricht"+(stufe+1)], 130, 128);
    }
}

function getMousePos(evt) {
    var rect = canvas.getBoundingClientRect(), // abs. size of element
        scaleX = canvas.width / rect.width,    // relationship bitmap vs. element for X
        scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for Y

    var clientX = evt.clientX;
    var clientY = evt.clientY;

    if (scaleX < scaleY) {
        scaleX = scaleY;
        clientX -= rect.width / 2 - (cw / scaleX) / 2;
    } else {
        scaleY = scaleX;
        clientY -= rect.height / 2 - (ch / scaleY) / 2;
    }
    var x = (clientX - rect.left) * scaleX;   // scale mouse coordinates after they have
    var y = (clientY - rect.top) * scaleY     // been adjusted to be relative to element

    return [x, y];
}

var presstarget = "";


function hitTest(image_name, xoff, yoff, x, y) {
    x = Math.floor(x);
    y = Math.floor(y);
    var alpha_mask = alpha_masks[image_name];
    var x_min = xoff;
    var y_min = yoff;
    var x_max = xoff + images[image_name].width;
    var y_max = yoff + images[image_name].height;
    if (x >= x_min && x <= x_max && y >= y_min && y <= y_max) {
        var mask_x = x - x_min;
        var mask_y = y - y_min;
        var mask_idx = mask_x + mask_y * images[image_name].width;
        return alpha_mask[mask_idx];
    }
    return false;
}

function handleTap(e) {

    //if right-click, cancel - don't show context-menu
    if (e.button === 2) {
        e.preventDefault();
        return;
    }

    var [mouseX, mouseY] = getMousePos(e);

    var power_button_mask_name = interface_an ? "schalter_an" : "schalter_aus";
    if (hitTest(power_button_mask_name, 130, 32, mouseX, mouseY)) {
        if (interface_an) { 
            button_interface_an(); 
        } else { 
            button_interface_aus(); 
        }
        redraw();
    }

    for (var i = 0; i < clickable_buttons.length; i++) {
        var button = clickable_buttons[i];
        // [ ID, x, y, img, img_pressed, current_state, callback, visible]

        if (button[7] && hitTest(button[5] ? button[4] : button[3], button[1], button[2], mouseX, mouseY)) {
            presstarget = button[0];
            button[5] = true;
            redraw();
        }
    }
}

function handleUntap(e) {
    
    if (e.button === 2) {
        e.preventDefault();
        return;
    }

    var [mouseX, mouseY] = getMousePos(e);

    for (var i = 0; i < clickable_buttons.length; i++) {
        var button = clickable_buttons[i];
        // [ ID, x, y, img, img_pressed, current_state, callback, visible]
        if (presstarget === button[0]) {
            if (button[5]) {
                if (hitTest(button[3], button[1], button[2], mouseX, mouseY)) {
                    button[6]();
                }
            }
        }
        button[5] = false;
    }

    redraw();

}

canvas.addEventListener("pointerdown", handleTap);
canvas.addEventListener("pointerup", handleUntap);

/////////////////////////////////////////////
/*

var spawn;


function redraw(){

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(images[bg_name[sprache]], 0, 0);	

    //nächst
    var nox=115;
    var noy=91;
    var nächst_stück=tetrominos[nächst][nächst_drehung];
    var nächst_z_h=nächst_stück.length;
    var nächst_z_b=nächst_stück[0].length;
    var nächst_h=nächst_z_h*8;
    var nächst_b=nächst_z_b*8;
	
    var zukünftiges_stück=tetrominos[zukünftiges][zukünftiges_drehung];
    var zukünftiges_z_h=zukünftiges_stück.length;
    var zukünftiges_z_b=zukünftiges_stück[0].length;
    var zukünftiges_h=zukünftiges_z_h*8;
    var zukünftiges_b=zukünftiges_z_b*8;
	

    nox+=(4*8-zukünftiges_b)/2;
    noy+=(4*8-zukünftiges_h)/2;
    for (var i=0;i<zukünftiges_z_b;i++){
        for (var j=0;j<zukünftiges_z_h;j++){
            var z=zukünftiges_stück[j][i];
            if (z!==0){
                var x=nox+8*i;
                var y=noy+8*j;
            	
                var lu = lookup(zukünftiges,zukünftiges_stück[j][i]);
                var tx=8*lu[0];
                var ty=8*lu[1];
                ctx.drawImage(images[template_namen[zukünftiges]],tx,ty,8,8,x,y,8,8);
            }
        }
    }

    for (var i=0;i<raster_b;i++){
        for (var j=verborgene_zeilen;j<raster_h;j++){
            var z=zustand[j][i];
            if (z!==0){
                var sbx=15;
                var sby=29;

                var x=sbx+8*i;
                var y=sby+8*(j-verborgene_zeilen);
            	
                var datum=zustand[j][i];
                var stücktyp=datum>>5;
                console.log(stücktyp);
                var lu = lookup(stücktyp,datum);
                var tx=8*lu[0];
                var ty=8*lu[1];

                ctx.drawImage(images[template_namen[stücktyp]],tx,ty,8,8,x,y,8,8);
            }
        }
    }

    projizieren();

    // for(var i=0;i<3;i++){
    // 	var z_b=3;
    // 	var z_h=5;
    // 	var z_x=125;
    // 	var z_y=70;
    // 	var ziffer= Math.floor(score/(Math.pow(10,i)))%10;
    // 	ctx.drawImage(images["ziffer_sch"],3*ziffer,0,z_b,z_h,z_x+4*i,z_y,z_b,z_h);
    // }


    for(var i=0;i<3;i++){
        var z_b=3;
        var z_h=5;
        var z_x=125;
        var z_y=161;
        var ziffer= Math.floor(highscore/(Math.pow(10,i)))%10;
        ctx.drawImage(images["ziffer_sch"],3*ziffer,0,z_b,z_h,z_x+4*i,z_y,z_b,z_h);
    }


    if (stumm){
        ctx.drawImage(images["btn_stumm_aus"],137,175);
    }
    for(i=0;i<pressed.length;i++){
        if (pressed[i]){
            var dat = image_x_y[i];
            ctx.drawImage(images[dat[sprache]],dat[2],dat[3]);
        }
    }


    if (verloren){
        ctx.drawImage(images[goimg_name[sprache]],15,29);
    } else if (siegreich){		
        ctx.drawImage(images[siegimg_name[sprache]],15,29);
    }
}

var image_names=[
    "winbg2_de",
    "winbg2_en",
    "verloren_en",
    "verloren_de",
    "siegreich_en",
    "siegreich_de",
    "template_1",
    "template_2",
    "template_3",
    "template_4",
    "template_5",
    "template_6",
    "template_7",
    "template_umriss",
    "ziffer_sch",
    "btn_oben_de",
    "btn_unten_de",
    "btn_links_de",
    "btn_rechts_de",
    "btn_oben_en",
    "btn_unten_en",
    "btn_links_en",
    "btn_rechts_en",
    "btn_neustart_de",
    "btn_neustart_en",
    "btn_sprache_de",
    "btn_sprache_en",
    "btn_stumm_gedrückt",
    "btn_stumm_aus",
    "btn_stumm_aus_gedrückt",
    ];

var stumm=false;

var image_x_y=[
["btn_oben_en","btn_oben_de",14,16,82,11],
["btn_unten_en","btn_unten_de",14,175,82,11],
["btn_links_en","btn_links_de",2,28,11,146],
["btn_rechts_en","btn_rechts_de",97,28,11,146],
["btn_neustart_en","btn_neustart_de",112,16,39,11],
["btn_sprache_en","btn_sprache_de",112,175,14,11],
["btn_stumm_gedrückt","btn_stumm_gedrückt",137,175,14,11],
];


function trypush(dx,dy){
    var anymoved=false;	
    for (var i=0;i<gw;i++){
        for (var j=0;j<gh;j++){
            if (state[i][j]===0){
                continue;
            }

            var ti=i+dx;
            var tj=j+dy;
            if (ti<0||ti>=gw||tj<0||tj>=gh){
                continue;
            }
            if (state[ti][tj]===0){
                state[ti][tj]=state[i][j];
                state[i][j]=0;

                anim[ti][tj][0]=anim[i][j][0]-dx;
                anim[ti][tj][1]=anim[i][j][1]-dy;
                anim[i][j][0]=0;
                anim[i][j][1]=0;


                anymoved=true;
            }
        }
    }
    return anymoved;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function clearAnim(){
    for (var i=0;i<gw;i++){
        for (var j=0;j<gh;j++){
            anim[i][j][0]=0;
            anim[i][j][1]=0;
            spawn[i][j]=0;
        }
    }
}

function full(){
    for (var i=0;i<gw;i++){
        for (var j=0;j<gh;j++){
            if (state[i][j]===0){
                return true;
            }
        }
    }
    return false;
}

var moving=false;

function ErzeugenMöglich(){
    for (var j=0;j<verborgene_zeilen;j++){
        for (var i=0;i<raster_b;i++){
            if (zustand[j][i]!==0){
                return false;
            }
        }
    }
    var stück=tetrominos[nächst][nächst_drehung];
    var nächst_z_h=stück.length;
    var nächst_z_b=stück[0].length;

    var ox=15;
    var oy=29-4*8;

    var sx=5-Math.ceil(nächst_z_b/2);
    var sy=0;

    for (var i=0;i<nächst_z_b;i++){
        var globale_z_x=sx+i;
        for (var j=0;j<nächst_z_h;j++){
            var globale_z_y=sy+j;
            if (zustand[globale_z_y][globale_z_x]>0){
                return false;
            }
        }
    }
    return true;
}

async function doMove(dx,dy){
    //stück erzeugen
    if (verloren||siegreich){
        return Promise.resolve(1);
    }


    if (dy==1){
        if (ErzeugenMöglich()===false){
            verloren=true;
            redraw();
            return Promise.resolve(1);
        }

        var stück=tetrominos[nächst][nächst_drehung];
        var nächst_z_h=stück.length;
        var nächst_z_b=stück[0].length;

        var ox=15;
        var oy=29-4*8;

        var sx=5-Math.ceil(nächst_z_b/2)+soff;
        var sy=0;
        soff=0;
        for (var i=0;i<nächst_z_b;i++){
            var globale_z_x=sx+i;
            for (var j=0;j<nächst_z_h;j++){
                var globale_z_y=sy+j;
                zustand[globale_z_y][globale_z_x]=stück[j][i];
            }
        }

        wähleNeuesStück();

        if(!stumm){
            playSound(4159307);
        }
    } else {
        if(!stumm){
            playSound(44213107);
        }
    }




    var bewegt=true;
    while (bewegt){
        bewegt=false;

        var neuezustand=[];
        for (var j=0;j<raster_h;j++){
            var zeile=[];
            for (var i=0;i<raster_b;i++){
                zeile.push(0);
            }
            neuezustand.push(zeile);
        }

        for (var i=0;i<raster_b;i++){
            for (var j=0;j<raster_h;j++){
                if (zustand[j][i]===0){
                    anims[j][i]=0;
                } else {
                    anims[j][i]=1;
                }
            }
        }


        var verarbeiten=true;
        while (verarbeiten){
            verarbeiten=false;

            //bewegungen versperren

            for (var i=0;i<raster_b;i++){
                for (var j=0;j<raster_h;j++){
                    //wenn animation versperrt, mach propagation
                    if (zustand[j][i]>0 && anims[j][i]>0){
                        //prüf in der richtung der Bewegung
                        var tx=i+dx;
                        var ty=j+dy;
                        if (tx<0||ty<0||tx>=raster_b||ty>=raster_h){
                            anims[j][i]=0;
                            verarbeiten=true;
                        } else if (zustand[ty][tx]>0 && anims[ty][tx]===0){
                            anims[j][i]=0;
                            verarbeiten=true;							
                        } else {
                            //prüf verbundnen Ziegel
                            var datum = zustand[j][i];
                            //2*v_rechts+4*v_links+8*v_unten+16*v_oben
                            var v_oben=(datum>>4)&1;
                            var v_unten=(datum>>3)&1;
                            var v_links=(datum>>2)&1;
                            var v_rechts=(datum>>1)&1;
                            if (v_oben===1){
                                if (anims[j-1][i]==0){
                                    anims[j][i]=0;
                                    verarbeiten=true;													
                                }
                            }
                            if (v_unten===1){
                                if (anims[j+1][i]==0){
                                    anims[j][i]=0;
                                    verarbeiten=true;													
                                }
                            }
                            if (v_links===1){
                                if (anims[j][i-1]==0){
                                    anims[j][i]=0;
                                    verarbeiten=true;													
                                }
                            }
                            if (v_rechts===1){
                                if (anims[j][i+1]==0){
                                    anims[j][i]=0;
                                    verarbeiten=true;													
                                }
                            }
                        }
                    }
                }
            }
        }

        //mach bewegungen
        var was_ist_bewegt=false;
        for (var i=0;i<raster_b;i++){
            for (var j=0;j<raster_h;j++){
                var datum=zustand[j][i];
                if (datum!==0){
                    if (anims[j][i]===0){
                        neuezustand[j][i]=datum;
                    } else {
                        neuezustand[j+dy][i+dx]=datum;
                        anims[j][i]=0;
                        was_ist_bewegt=true;
                    }
                }
            }
        }
        zustand=neuezustand;

        if (was_ist_bewegt){
            bewegt=true;
        }	

        if (bewegt){
            await sleep(30);
            redraw();
            // if (dx!==0){
            // 	return Promise.resolve(1);				
            // }
        } else {

            if(!stumm){
                playSound(67641907);
            }
        }

    }

    await prüfZeilen();

    if (ErzeugenMöglich()===false){
        verloren=true;
        redraw();
    }
    return Promise.resolve(1);
}

function dsoff(ds){
    var newsoff=soff+ds;

    var stück=tetrominos[nächst][nächst_drehung];
    var nächst_z_h=stück.length;
    var nächst_z_b=stück[0].length;

    var ox=15;
    var oy=29-4*8;

    var sx=5-Math.ceil(nächst_z_b/2)+newsoff;
    var sy=0;

    var px=sx;
    var py=0;

    if (darfPlatzieren(stück,sx,sy)){
        soff=newsoff;
    }
}

function oob(){
    var stück=tetrominos[nächst][nächst_drehung];
    var nächst_z_h=stück.length;
    var nächst_z_b=stück[0].length;

    var ox=15;
    var oy=29-4*8;

    var sx=5-Math.ceil(nächst_z_b/2)+soff;
    var sy=0;

    var px=sx;
    var py=0;

    if (darfPlatzieren(stück,sx,sy)===false){
        if (soff<0){
            soff++;
            oob();
        }
        if (soff>0){
            soff--;
            oob();
        }
    }
}

async function doPress(i){

    if (moving===true){
        return;
    }

    moving=true;

    pressed[i]=true;
	
    if (i===0){
        // await doMove(0,-1);
        nächst_drehung=(nächst_drehung+1)%tetrominos[nächst].length;
        oob();
    } else if (i===1){
        await doMove(0,1);
    } else if (i===2){
        dsoff(-1);
        await doMove(-1,0);
    } else if (i===3){	
        dsoff(1);
        await doMove(1,0);
    } else if (i===4){
        await resetGame();
    } else if (i===5){
        sprache=1-sprache;
        // await resetGame();
    } else if (i===6){
        stumm=!stumm;
        if (stumm===true){
            image_x_y[6][0]="btn_stumm_aus_gedrückt";
            image_x_y[6][1]="btn_stumm_aus_gedrückt";
        } else {
            image_x_y[6][0]="btn_stumm_gedrückt";
            image_x_y[6][1]="btn_stumm_gedrückt";
        }
    }

    moving=false;
    redraw();

}

var target=-1;



function emptyCells(){
    var result=[];
    for(var i=0;i<gw;i++){
        for (var j=0;j<gh;j++){
            if (state[i][j]===0){
                result.push([i,j]);
            }
        }
    }
    return result;
}

function neighbors (x,y){
  var result=[];
  if (x>0){
    result.push([x-1,y]);
  }
  if (x<gw-1){
    result.push([x+1,y]);
  }
  if (y>0){
    result.push([x,y-1]);
  }
  if (y<gh-1){
    result.push([x,y+1]);
  }
  return result;
}

function versuchFloodFill(x,y,todelete){


    if (state[x][y]===0){
      return false;
    }

  var farbe = state[x][y];
  
  var base_idx=x+gw*y;
  if (todelete.indexOf(base_idx)>=0){
    return false;
  }

  
  var visited=[base_idx];

  var modified=true;
  while(modified){
    modified=false;

    for (var i=0;i<gw;i++){
      for (var j=0;j<gh;j++){
        var idx = i+gw*j;
        if (visited.indexOf(idx)>=0){
          continue;
        }

        //check if you've visited neighbours
        var hasneighbour=false;
        var nbs = neighbors(i,j);
        for (var k=0;k<nbs.length;k++){
          var nb = nbs[k];
          var nbi=nb[0]+gw*nb[1];
          if (visited.indexOf(nbi)>=0){
            hasneighbour=true;
          }
        }
        if (hasneighbour===false){
          continue;
        }

        var zelle_farbe=state[i][j];
        if (zelle_farbe==0){
          //escaped -- return! :)
          return false;
        }
        if (zelle_farbe!==farbe){
          continue;
        }

        visited.push(idx);
        modified=true;
      }
    }
  }

  if (visited.length===16){
    visited=[];
  }
  for (var i=0;i<visited.length;i++){
    todelete.push(visited[i]);
  }
  return visited.length>0;
}


function handleKeyDown(e){
    if (e.key==="ArrowUp"||e.key=="W"||e.key=="w"){
        doPress(0);
        e.preventDefault();
        return false;
    }
    if (e.key==="ArrowDown"||e.key===" "||e.key=="S"||e.key=="s"){
        doPress(1);
        e.preventDefault();
        return false;
    }
    if (e.key==="ArrowLeft"||e.key=="A"||e.key=="a"){
        doPress(2);
        e.preventDefault();
        return false;
    }
    if (e.key==="ArrowRight"||e.key=="D"||e.key=="d"){
        doPress(3);
        e.preventDefault();
        return false;
    }
    if (e.key.toLowerCase()==="r"||e.key.toLowerCase()==="n"){
        doPress(4);
        e.preventDefault();
        return false;
    }
    if (e.key.toLowerCase()==="e"||e.key.toLowerCase()==="e"){
        doPress(5);
        e.preventDefault();
        return false;
    }
    if (e.key.toLowerCase()==="m"||e.key.toLowerCase()==="M"){
        doPress(6);
        e.preventDefault();
        return false;
    }
}

var pressed=[false,false,false,false,false,false,false];

function handleKeyUp(e){
    if (e.key==="ArrowUp"||e.key=="W"||e.key=="w"){
        pressed[0]=false;
        redraw();
    }
    if (e.key==="ArrowDown"||e.key===" "||e.key=="S"||e.key=="s"){
        pressed[1]=false;
        redraw();
    }
    if (e.key==="ArrowLeft"||e.key=="A"||e.key=="a"){
        pressed[2]=false;
        redraw();
    }
    if (e.key==="ArrowRight"||e.key=="D"||e.key=="d"){
        pressed[3]=false;
        redraw();
    }
    if (e.key.toLowerCase()==="r"||e.key.toLowerCase()==="n"){
        pressed[4]=false;
        redraw();
    }
    if (e.key.toLowerCase()==="e"||e.key.toLowerCase()==="e"){
        pressed[5]=false;
        redraw();
    }
    // console.log("key
    if (e.key.toLowerCase()==="m"||e.key.toLowerCase()==="M"){
        pressed[6]=false;
        redraw();
    }
    // console.log("keyup "+e.key)
}

canvas.addEventListener("pointerdown",handleTap);
canvas.addEventListener("pointerup",handleUntap);
document.addEventListener("keydown",handleKeyDown);
document.addEventListener("keyup",handleKeyUp);

highscore = parseInt(localStorage.getItem('my_max_combo'));
if (Number.isNaN(highscore)){
    highscore=0;
}
resetGame();

*/