/*
frida script to dump all mines in gnome mines
895fded495caab76fff323f0087ae52d51038870e99b8b9813ace261f5aa43e2  /usr/games/gnome-mines
gnome-mines 3.32.0

find minefield_click by the string minefield_clear_mine

I think a better fit for this function is minefield click however i think the original name 
is indeed minefield_clear_mine

offsets should fit either way.
*/

var gnome_mines_base = Module.findBaseAddress('gnome-mines')

var MineboardData = {
    get_config_mines: function(p) {
        return p.add(0x28).readU32();
    },
    get_board_size_y: function(p) {
        return p.add(0x24).readU32();
    },
    get_board_size_x: function(p) {
        return p.add(0x20).readU32()
    },
    has_bomb: function(p, x, y) {
        console.log('has_bomb', p, x, y);

        var size_y = MineboardData.get_board_size_y(p);

        var board_square_array = p.add(0x30).readPointer();

        console.log('board_square_array', board_square_array);
        var square_obj = board_square_array.add((size_y * y + x) * 8).readPointer();

        return square_obj.add(0x20).readU32();
    }
};

function get_mines_string(mineboard_ptr){
    var board_size_x = MineboardData.get_board_size_x(mineboard_ptr);
    var board_size_y = MineboardData.get_board_size_y(mineboard_ptr);

    var board_string = '';

    for(var i = 0; i < board_size_x; i++) {
        for(var j = 0; j < board_size_y; j++){
            if(MineboardData.has_bomb(mineboard_ptr, i, j)) {
                board_string += '| * |';
            } else {
                board_string += '|   |';
            }
        }

        board_string += '\n';
    }

    return board_string;
}

function parse_mineboard(mineboard_ptr){
    console.log('parsing mineboard...', mineboard_ptr);
    console.log('config mines: ', MineboardData.get_config_mines(mineboard_ptr));
    console.log('board size X * Y', MineboardData.get_board_size_x(mineboard_ptr), '*', MineboardData.get_board_size_y(mineboard_ptr));

    console.log(get_mines_string(mineboard_ptr));
}

function hook_minefield_click(){
    console.log('hooking minefield click');
    Interceptor.attach(
        // minefield_click function offset
        // refer to instructions above to see how to find it.
        gnome_mines_base.add(0xbb50),
        {
            onEnter: function(args) {
                this._mineboard = this.context['rdi'];
            },
            onLeave: function(retval){
                parse_mineboard(this._mineboard);
            }
        }
    )
}

function main(){
    hook_minefield_click();
}

if(!gnome_mines_base) {
    console.error('unable to find gnome mines base, are you in the correct process?');
} else {
    console.log('found gnome-mines, starting script...');
    main();
}
