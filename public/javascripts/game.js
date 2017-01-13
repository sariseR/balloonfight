const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const SCREEN_WIDTH = window.innerWidth + 1;
const SCREEN_HEIGHT = window.innerHeight;
const ROOM_ADDRESS = 'http://192.168.1.66:3000';  // PC側のアドレス
var socket = io.connect();  //socket IO
var lastTimestamp = null;
var room; //部屋オブジェクト
var players = new Array();  // プレイヤオブジェクトの配列
var mousePless = false;//マウスが押されているかどうか
var mouse = new Point();//マウスの座標を記憶するオブジェクトを生成
var startflag = false;//対戦開始フラグ
canvas.addEventListener('mousemove', mouseMove, true);//マウス座標取得リスナ
canvas.addEventListener('mousedown', mouseDown, true);//マウス押し込み取得リスナ
canvas.addEventListener('mouseup', mouseUp, true);//マウス離し取得リスナ
var bullets = new Array();  // 弾丸オブジェクトの配列
var testCount;//動作確認用カウンター
window.addEventListener('load', init);

function Point(){//プレイヤーのマウスの座標を格納するクラス(随時拡張予定)
    this.x = 0;
    this.y = 0;
}
//初期化
function init() {
    canvas.width = SCREEN_WIDTH;
    canvas.height = SCREEN_HEIGHT;
    testCount = 0;
    room = new Room();
    // var assetManager = new AssetManager();

    //メイン画面が生成されたことをサーバに報告
    socket.emit(SocketSignals.ctsMainStart());
    //サーバからルームIDを取得
    socket.on(SocketSignals.stcMainRoomID(), function(data) {
        room.setId(data.value);
        console.log(data.value);
        $('#qrcode').qrcode(room.url());
        $('#conUrl').append('<p><a href=' + room.url() + '>controller</a></p>');
        console.log('success in ' + room.getId());
        console.log('canvas size '+canvas.width+":"+canvas.height);
    });

    socket.on(SocketSignals.stcMainPlayerLogin(),function(data) {
        players.push(new Player(data.value,canvas.width,canvas.height));//プレイヤーを追加
        console.log('player '+data.value+' login!');
    });
        socket.on(SocketSignals.stcConTouchFlg(), function(data) {
      var touchFlg = data.value;
      var conId = data.id;
      console.log('touchFlg: ' + touchFlg[0]);
      if(players.length >= 1) {
        for(var i = 0; i <  players.length; i++) {
            if(players[i].getplayerId()==conId){
                if(touchFlg[0]) {  // left
                    players[i].setLeftFlag(true);
                }
                if(!touchFlg[0]) {
                    players[i].setLeftFlag(false);
                }
                if(touchFlg[1]) {  // right
                    players[i].setRightFlag(true);
                }
                if(!touchFlg[1]) {
                    players[i].setRightFlag(false);
                }
                if(touchFlg[2]) {  // jump
                    players[i].setJumpFlag(true);
                }
                if(!touchFlg[2]) {
                    players[i].setJumpFlag(false);
                }
                if(touchFlg[3]) {  // shot
                players[i].setShotFlag(true);
                }
                if(!touchFlg[3]) {
                    players[i].setShotFlag(false);
                }
            }
        }
      }
    });
    requestAnimationFrame(update);
}

//更新処理
function update(timestamp) {
    var delta = 0;
    
    if(mouse.x>=SCREEN_WIDTH/2-50&&mouse.x<=SCREEN_WIDTH/2-50+100&&mouse.y>=SCREEN_HEIGHT/2+20&&mouse.y<=SCREEN_HEIGHT/2+20+30&&mousePless==true&&startflag==false){
        startflag=true;
    }
    
    if(lastTimestamp != null) {
        delta = (timestamp -lastTimestamp) / 1000;
    }
    lastTimestamp = timestamp;
    
    //ゲームが開始している場合の処理
    if(startflag==true){
    //プレイヤの更新処理を行う
    for(var i = 0; i < players.length; i++) {
        players[i].update();
        if(players[i].getShotStartFlag()==true){//i番目のプレイヤがショットを行なっている場合
            bullets.push(new Bullet(players[i].getPosX(),players[i].getPosY(),players[i].getDir(),players[i].getplayerId()));
            players[i].setShotFin();
        }
    }
    testCount ++;
    if(testCount%60==0){
        if(players.length>0){
        //bullets.push(new Bullet(players[0].getPosX(),players[0].getPosY(),players[0].getDir(),players[0].getplayerId()));
        }
    }
    for(var i = 0; i < bullets.length; i++) {
        bullets[i].update();
    }
    /*
    socket.on(SocketSignals.stcConTouchFlg(), function(data) {
      var touchFlg = data.value;
      var conId = data.id;
      console.log('touchFlg: ' + touchFlg[0]);
      if(players.length >= 1) {
        for(var i = 0; i <  players.length; i++) {
            if(players[i].getplayerId()==conId){
                if(touchFlg[0]) {  // left
                    players[i].setLeftFlag(true);
                }
                if(!touchFlg[0]) {
                    players[i].setLeftFlag(false);
                }
                if(touchFlg[1]) {  // right
                    players[i].setRightFlag(true);
                }
                if(!touchFlg[1]) {
                    players[i].setRightFlag(false);
                }
                if(touchFlg[2]) {  // jump
                    players[i].setJumpFlag(true);
                }
                if(!touchFlg[2]) {
                    players[i].setJumpFlag(false);
                }
                if(touchFlg[3]) {  // shot
                players[i].setShotFlag(true);
                }
                if(!touchFlg[3]) {
                    players[i].setShotFlag(false);
                }
            }
        }
      }
    });
    */
    }

    requestAnimationFrame(update);
    render();
}

// 再描画
function render() {
    //全体をクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    //背景を表示
    // var back = new Image();
    // back.src = 'images/back.png';
    // ctx.drawImage(back, 0, 0);

    //各プレイヤーを描画
    for(var i = 0;i<players.length;i++){
        players[i].draw(ctx);
    }
    
    for(var i = 0;i<bullets.length;i++){
        bullets[i].draw(ctx);
    }
    if(startflag==false){
    ctx.font = "24px 'ＭＳ Ｐゴシック'";
    ctx.fillStyle = "rgba(205,205,205,1)";
    ctx.strokeStyle = "rgba(205,205,250,1)";
    ctx.textAlign="center";
    ctx.fillText(players.length+"人",SCREEN_WIDTH/2,SCREEN_HEIGHT/2);
    ctx.fillText("START",SCREEN_WIDTH/2,SCREEN_HEIGHT/2+45);
    ctx.strokeRect(SCREEN_WIDTH/2-50,SCREEN_HEIGHT/2+20,100,30);
        if(mouse.x>=SCREEN_WIDTH/2-50&&mouse.x<=SCREEN_WIDTH/2-50+100&&mouse.y>=SCREEN_HEIGHT/2+20&&mouse.y<=SCREEN_HEIGHT/2+20+30){
        ctx.fillStyle = "rgba(205,205,205,0.2)";
        ctx.fillRect(SCREEN_WIDTH/2-50,SCREEN_HEIGHT/2+20,100,30);
    }
    }
    
    
}
function mouseMove(event){
    // マウスカーソル座標の更新
    mouse.x = event.clientX - canvas.offsetLeft;
    mouse.y = event.clientY - canvas.offsetTop;
}
function  mouseDown(event){
    mousePless = true;
}
function mouseUp(event){
    mousePless = false;
}
