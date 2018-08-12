
let findExec = require('find-exec')
  , cp = require('child_process')
  , players = [
    'mplayer',
    'afplay',
    'mpg123',
    'mpg321',
    'play',
    'omxplayer',
    'aplay',
    'cmdmp3'
  ];
let spawn = cp.spawn;
let globalEventId = 1;//默认为1
interface Event {
  id: number;
  exec: (data?: any) => void;
}
interface EventMap {
  [key: string]: Event[];
}
class Play {
  private players: any;
  private player: any;
  private process: any;
  private playList: string[] = [];
  private playIndex: number = 0;
  private random: boolean = false;
  private repeat: string = 'all';
  private eventCallbackMap: EventMap = {};
  constructor(opts?: any) {
    opts = Object.assign({
      playList: [],
      repeat: 'all',//all,one,off
      random: false,//是否开启随机
    }, opts);
    this.players = opts.players || players;
    this.player = opts.player || findExec(this.players);
    this.playList = opts.playList;
    this.random = opts.random;
    this.repeat = opts.repeat;
    if (!(this.playList.length > 0)) {
      throw (new Error("No audio file specified"));
    }
    if (!this.player) {
      throw (new Error("Couldn't find a suitable audio player"));
    }
  }
  on(event: string, callback: () => void): number {
    let eventId = getEventId();
    if (this.eventCallbackMap[event]) {
      this.eventCallbackMap[event].push({
        id: eventId,
        exec: callback
      });
    } else {
      this.eventCallbackMap[event] = [{
        id: eventId,
        exec: callback
      }];
    }
    return eventId;
  }
  emit(event: string, data?: any) {
    if (this.eventCallbackMap[event]) {
      this.eventCallbackMap[event].forEach(event => {
        if (event.exec) {
          if (data) {
            event.exec(data);
          } else {
            event.exec();
          }
        }

      });
    }
  }
  off(eventId: number) {
    let keys = Object.keys(this.eventCallbackMap);
    keys.forEach(key => {
      for (let i = 0; i < this.eventCallbackMap[key].length; i++) {
        if (this.eventCallbackMap[key][i].id === eventId) {
          delete this.eventCallbackMap[key][i];
          return;
        }
      }
    });
  }
  play() {
    if (this.process) {
      this.stop();
    }
    let options = {
      stdio: 'ignore'
    };//执行命令的options
    if (this.playList.length > 0 && this.playList[this.playIndex]) {
      let args = ['-q', '1', this.playList[this.playIndex]];
      let soundProcess = spawn(this.player, args, options);

      this.process = soundProcess;
      if (!this.process) {
        throw (new Error("Unable to spawn process with " + this.player));
      }
      this.process.on('close', (err: any, signal: any) => {
        if (err && !err.killed) {
          this.emit('stop');
          throw err;
        } else if (err === 0) {
          //next
          this.autoNext();
          return;
        }else{
          this.emit('stop');
        }
      });

      this.process.on('error', (err: any) => {
        this.emit('stop');
        throw (new Error("Unable to spawn process with " + this.player));
        
      });
    } else {
      throw new Error('No audio file specified');
    }

  }
  private autoNext() {
    if (this.random) {
      //index
      if (this.repeat !== 'one') {
        this.playIndex = Play.getRandomInt(0, this.playList.length);
      }
    } else {
      if (this.repeat === 'all') {
        if (this.playList[this.playIndex + 1]) {
          this.playIndex = this.playIndex + 1;
        } else {
          this.playIndex = 0;
        }
      } else if (this.repeat === 'off') {
        if (this.playList[this.playIndex + 1]) {
          this.playIndex = this.playIndex + 1;
        } else {
          //stop
          this.stop();
          return;
        }
      }

    }
    this.play();
  }
  public next() {
    if (this.playList[this.playIndex + 1]) {
      this.playIndex = this.playIndex + 1;
    } else {
      this.playIndex = 0;
    }
    this.play();
  }
  public previous() {

    if (this.playList[this.playIndex - 1]) {
      this.playIndex = this.playIndex - 1;
    } else {
      this.playIndex = this.playList.length - 1;
    }

    this.play();
  }
  stop() {
    if (this.process) {
      this.process.kill('SIGKILL');
    }
  }
  resume() {
    if (this.process) {
      this.process.kill('SIGCONT');
    }
  }
  pause() {
    if (this.process) {
      this.process.kill('SIGSTOP');

    }
  }
  static getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
  }
}

function getEventId(): number {
  return ++globalEventId;
}
export default Play;
