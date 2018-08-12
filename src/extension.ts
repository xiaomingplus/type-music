'use strict';

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { workspace, commands, window, Disposable, ExtensionContext } from 'vscode';
import Player from './player';
const path = require('path');
let globalPlayer: any;
let isInit = false;//是否初始化
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
    const player = new Player({
        playList: [
            path.resolve(__dirname, '../sounds/typewriter-key-1.mp3'),
            path.resolve(__dirname, '../sounds/Gymnopedie_No_3.mp3')

        ]
    });
    globalPlayer = player;
    console.log('Congratulations, your extension "Type-Music" is now active!');
    let status = context.globalState.get('status', 'open');
    let disposable = commands.registerCommand('extension.toggle', () => {
        // The code you place here will be executed every time your command is executed
        status = context.globalState.get('status', 'open');
        if (status === 'open') {
            player.stop();
            context.globalState.update('status', 'close');
            // Display a message box to the user
            window.showInformationMessage('ok,now type music is closed!');
        } else {
            context.globalState.update('status', 'open');
            if (!isInit) {
                let music = new Music(player);
                let controller = new MusicController(music, context);
                // Add to a list of disposables which are disposed when this extension is deactivated.
                context.subscriptions.push(music);
                context.subscriptions.push(controller);
                isInit = true;
            }

            window.showInformationMessage('ok,now type music is open!');

        }

    });
    context.subscriptions.push(disposable);

    if (status === 'open') {
        // create a new word counter
        let music = new Music(player);
        let controller = new MusicController(music, context);
        // Add to a list of disposables which are disposed when this extension is deactivated.
        context.subscriptions.push(music);
        context.subscriptions.push(controller);
        isInit = true;
    }




}

// this method is called when your extension is deactivated
export function deactivate() {
    if (globalPlayer) {
        globalPlayer.stop();//stop
    }
}
class MusicController {

    private _music: Music;
    private _disposable: Disposable;
    private _context: ExtensionContext | undefined;
    constructor(Music: Music, context: ExtensionContext) {
        this._music = Music;
        this._context = context;
        // subscribe to selection change and editor activation events
        let subscriptions: Disposable[] = [];
        workspace.onDidChangeTextDocument(this._onEvent, this, subscriptions);
        // create a combined disposable from both event subscriptions
        this._disposable = Disposable.from(...subscriptions);
    }

    dispose() {
        this._disposable.dispose();
    }

    private _onEvent() {
        let status = 'close';
        if (this._context) {
            status = this._context.globalState.get('status', 'open');
        }
        if (status === 'open') {
            this._music.onTyping();
        }
    }
}

enum MusicState {Init, Playing, Pause  }
class Music {
    private _lastTypingTime: number = 0;
    private _timer: NodeJS.Timer | undefined;
    private _stopTimer: NodeJS.Timer | undefined;
    private _musicState: MusicState = MusicState.Init;
    private player: any;
    constructor(player: any) {
        this.player = player;
        this.player.on('stop',()=>{
            this._musicState = MusicState.Init;
        });
    }
    public onTyping() {
        //是否开启了功能
        this._lastTypingTime = new Date().getTime();//记录上一次打字时间
        //当开始打字的时候，开启一个计时器，定时去查看是否有在打字
        if (this._timer) {
            //如果有，那就清空
            clearTimeout(this._timer);
        }
        if (this._stopTimer) {
            clearTimeout(this._stopTimer);
        }
        this._timer = setTimeout(() => {
            //是否有在打字，
            let nowTime = new Date().getTime();
            let howLongTimeFromLastTyping = nowTime - this._lastTypingTime;
            if (howLongTimeFromLastTyping < 2000) {
                //在打字
                // donothing
            } else {
                //不再打字了，暂停播放
                this.pause();
                this._stopTimer = setTimeout(() => {
                    //在打字
                    //30s没有工作就stop，避免影响别的音乐程序
                    this.stop();
                }, 30 * 1000);
            }
        }, 3000);
        //是否正在播放
        if (this._musicState === MusicState.Init) {
            //还没开始播放，那么就播放
            this.start();
        } else if (this._musicState === MusicState.Pause) {
            this.resume();
        } else if (this._musicState === MusicState.Playing) {
            //do nothing.
        }
    }
    public pause() {
        //停止播放
        if(this._musicState === MusicState.Playing){
            this._musicState = MusicState.Pause;
            if (this.player) {
                this.player.pause();
            }
        }

    }
    public async start() {
        //开始播放
        this._musicState = MusicState.Playing;

        // create player instance
        if (this.player) {
            this.player.play();
        }

    }
    public resume() {
        //继续播放
        this._musicState = MusicState.Playing;
        if (this.player) {
            this.player.resume();
        }
    }
    public stop() {
        //停止播放
        this._musicState = MusicState.Init;
        if (this.player) {
            this.player.stop();
        }
    }
    dispose() {
    }
}