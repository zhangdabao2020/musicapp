// pages/index/index.js
const app = getApp()
let lineTimeId='';//水平线定时器
let isDelete=false;//是否删除开启的定时器
Page({
  /**
   * 页面的初始数据
   */
  data: {
    item: 0,
    tab: 0,
    viewItem : 3,//首页展示的列表 1：收藏，2：推荐 3： 排行, 4，搜索
    userInfo: {},//用户信息
    loop : 'cycle',
    hasUserInfo: false,
    userright:false,//用户是否有权限
    token:'',
    viewLrc:'cover',//默认显示歌词封面'cover',显示歌词 'lrc'
        /* 音乐播放相关数据 Starr */
    // 播放列表数据
    playlist: [],
    viewMusicList:[],//首页展示音乐列表。 默认展示排行
/* 成员格式
{
      id: 1,
      title: '',
      singer: '',
      src: '',
      coverImgUrl: ''
    } */
    state: 'paused',
    playIndex: 0,
    play: {
      currentTime: '00:00',
      duration: '00:00',
      percent: 0,
      title: '',
      singer: '',
      unfavor:'',
      coverImgUrl: '/images/cover.jpg',
    },
 
/* 音乐播放相关数据  end */
 //以下歌词
       isLrc:true,//是否显示歌词
       lrcArr:[],//歌词定位数组
       location:0,//歌词滚动位置
       locationIndex:0,//
       locationValue:0,//歌词滚动具体位置
       locationTime:0,//歌词定位时间
       locationShowTime:'00:00',//歌词定位显示时间
       isScroll:false//滚动显示水平线
  },
  audioCtx: null,
  //检查音乐列表资源
  checkMusicList : function(callback){
    
      //从缓存中拿列表数据
      var musicList = wx.getStorageSync('musicList');
      if(musicList){
        this.setData({
            playlist:musicList
        })
        if(musicList.length > 0){
          //默认选中第一首
          this.setMusic(0);
        }
      }else{
        callback({is_musicList:false})
        return
      }
    
},
//获取播放列表
getMusicList : function(){
 var that = this;
  wx.request({        
    url: 'http://localhost:5050/playlist',
    method:'GET',
    data:{
      token : app.globalData.token
    },
    fail (err){
      console.log(err);
    },
    success (res) {
         // console.log(res)  
         if(res.data.totle == 0){
           return;
         }
          var obj  = JSON.parse(res.data);
          var list = [];
          obj.forEach(element => {
          var pre = {};
          pre.id = element.id;
          pre.title = element.title;
          pre.singer = element.artist;
          pre.name = element.name;
          pre.src = 'http://localhost:5050/play/'+element.name;
          pre.coverImgUrl = element.coverImg;
          pre.unfavor = element.unfavor;
          list.push(pre);
        // that.data.playlist.push(pre);
          
      });
      
         //将播放列表保存为公共数据，
         if(list.length > 0){
            that.setData({
              playlist : list
            })
         
              //默认选中第一首
              that.setMusic(0);
            
            // 将token保存到数据缓存（下次打开小程序无需重新获取）
            wx.setStorage({ key: 'musicList', data: list })
           
         }
        
        
    }

  })
},

  //实现音乐播放功能

  musicPlay : function(){
    var that = this;
    //创建音乐播放上下文
    this.audioCtx = wx.getBackgroundAudioManager();
    
    // 播放进度检测
    this.audioCtx.onError(function() {
      console.log('播放失败：' + that.audioCtx.src)
    })
    
  },
  // 格式化时间
  formatTime : function(time) {
    var minute = Math.floor(time / 60) % 60;
    var second = Math.floor(time) % 60
    return (minute < 10 ? '0' + minute : minute) + ':' + (second < 10 ? '0' + second : second)
  },
// 选中音乐
 setMusic: function(index) {
  
  var music = this.data.playlist[index]
  //this.audioCtx.src = music.src;
  this.audioCtx.title = music.title;
  this.audioCtx.singer = music.singer;
  this.audioCtx.coverImgUrl = music.coverImgUrl;
  this.audioCtx.webUrl = '';
    var templay = {};
    templay.title = music.title;
    templay.singer = music.singer;
    templay.unfavor = music.unfavor;
    templay.name = music.name;
    templay.coverImgUrl = music.coverImgUrl;
    templay.currentTime = '00:00';
    templay.duration = '00:00';
    templay.percent = 0;
  this.setData({
    playIndex : index,
    play:templay
  })
  this.getData();
},




//单曲循环
single:function(){
    var index = this.data.playIndex;
    this.setData({
      playIndex:index
    })
    this.setMusic(index);
    if (this.data.state === 'running') {
      var music = this.data.playlist[index]
      this.audioCtx.src = music.src;
    }
},
//随机播放
radom : function(){
    var list = this.data.playlist;
    var index =   Math.floor(Math.random() * list.length + 1)-1;
    this.setData({
      playIndex:index
    })
    this.setMusic(index);
    if (this.data.state === 'running') {
      var music = this.data.playlist[index]
      this.audioCtx.src = music.src;
      
    }
    
},

// 滚动条调节歌曲进度
sliderChange: function(e) {
  var second = e.detail.value * this.audioCtx.duration / 100
  this.audioCtx.seek(second)
},
 //修改播放量
 updateTotalPlay:function(index){
  var music_id = this.data.playlist[index].id;
  wx.request({
    url: 'http://localhost:5050/settotal',
    method:'GET',
    data:{
      music_id : music_id
    },
    success(res){
      console.log(res.data);
    }
  })

},




  // 页面切换
  changeItem: function(e) {
    var curItem  = '0';
    if(e.target.dataset.item){
      curItem = e.target.dataset.item;
    }
    if(e.currentTarget.dataset.item){
      curItem = e.currentTarget.dataset.item;
    }
    this.setData({
      item: curItem,
    })
  },
  // tab切换
  changeTab: function(e) {
    this.setData({
      tab: e.detail.current
    })
  },


  onLoad:function(){
    var that = this
    if (app.globalData.userInfo) {
      that.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else {
      app.userInfoReadyCallback = res => {
        that.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
        
      }
    }
    
     var token = app.globalData.token;
     if(token){
      that.checkUserright();
     }else{
        setTimeout(that.checkUserright,1500);
     }
     that.musicPlay();
     this.checkMusicList(res =>{
      console.log('is_musicList:',res.is_musicList)
      if(!res.is_musicList){
        this.getMusicList();
      }

  })
  },

  // 实现播放器播放功能
  onReady: function() {

    var that = this;
     
      
     // 播放完成自动换下一曲
     that.audioCtx.onEnded(function() {
      if(that.data.loop == 'cycle'){
        that.next();
      }
      else if(that.data.loop == 'single'){
        that.single();
      }else{
        that.radom();
      }
      var token = app.globalData.token;
      var music_id = that.data.playlist[that.data.playIndex].id;
      wx.request({
        url: 'http://localhost:5050/history',
        method:'GET',
        data:{
          token:token,
          music_id:music_id
        },
        success(res){
          console.log(res.data);
        }
      })
      
      
    })
    // 自动更新播放进度
    that.audioCtx.onPlay(function() {
      
        that.setData({
          state:'running'
        })
    })
    that.audioCtx.onPause(function(){
      
      that.setData({
        state:'paused'
      })
    })
    that.audioCtx.onStop(function(){
      
    
      that.setData({
        state:'paused'
      })
    })
    that.audioCtx.onTimeUpdate(function() {
      var templay = that.data.play;
      templay.duration = that.formatTime(that.audioCtx.duration);
      templay.currentTime = that.formatTime(that.audioCtx.currentTime),
      templay.percent = that.audioCtx.currentTime / that.audioCtx.duration * 100 ;
      that.setData({
        play:templay
      })
      that.update();
    })

  },
  //获取用户信息
  getUserInfo: function (e) {
    console.log(e.detail.userInfo)
    if (e.detail.userInfo) {
      this.setData({
        userInfo: e.detail.userInfo,
        hasUserInfo: true
      })
    }
  },
//检查用户权限
checkUserright : function(){
  
    var that = this;
    var userright = wx.getStorageSync('userright');
    if(userright){
        that.setData({
          userright:userright
        })
        //初次加载。默认展示排行榜
       that.opsetViewMusicList(3);
       
    }
    var token = app.globalData.token;
    that.setData({
      token:token
    })
    wx.request({
      url: 'http://localhost:5050/checkright',
      method:'GET',
      data:{
        token:token
      },
      success(res){
          if(res.data.userright){
            //如果用户原来没有权限
            if(!userright){
              that.setData({
                userright:true
              })
              wx.setStorage({
                data: true,
                key: 'userright',
              })
              //初次加载。默认展示排行榜
             that.opsetViewMusicList(3);
            }
           
          }
          else{
            //用户没有权限
            that.setData({
              userright:false
            })
            wx.setStorage({
              data: false,
              key: 'userright',
            })
          }
      }
    })
},
  //跳转到我的收藏页面
  navigateToFavor : function(e){
      wx.navigateTo({
        url: '/pages/favor/favor'
      })
  },


  //上一曲
  pre:function(){
    
    var index = this.data.playIndex ==  0 ? this.data.playlist.length - 1 : this.data.playIndex - 1;
    this.setMusic(index);
    this.setData({
      playIndex:index
    })
    if (this.data.state === 'running') {
      var music = this.data.playlist[index]
      this.audioCtx.src = music.src;
      
    }
      
  },
  //下一曲
  next : function(){
    
    var index = this.data.playIndex >= this.data.playlist.length - 1 ? 0 : this.data.playIndex + 1
    this.setMusic(index);
    this.setData({
      playIndex : index
    })
    if (this.data.state === 'running') {
      var music = this.data.playlist[index]
      this.audioCtx.src = music.src;
    }
    
  },
  //暂停
  pause: function(){
    this.audioCtx.pause();
    this.setData({
      state:'paused'
    })
  } ,
  //播放
  play : function(){
    
    this.audioCtx.src = this.data.playlist[this.data.playIndex].src;
    this.audioCtx.title = this.data.playlist[this.data.playIndex].title;
    this.audioCtx.play();
    this.setData({
      state:'running'
    })
    
  },
//滑动条调节播放进度
sliderChange:function(e){
  var second = e.detail.value * this.audioCtx.duration / 100
  this.audioCtx.seek(second)
  
},
//播放列表换曲功能
change:function(e){
  this.setMusic(e.currentTarget.dataset.index)
  var music = this.data.playlist[e.currentTarget.dataset.index]
  this.audioCtx.src = music.src;
  this.updateTotalPlay(e.currentTarget.dataset.index);
  
},


  //获取首页音乐展示列表
  setViewMusicList : function(e){
    var that = this;
    var type = e.currentTarget.dataset.item
    that.opsetViewMusicList(type);
  },

  opsetViewMusicList :function(type){
    var that = this;
    that.setData({
      viewItem:type
    });
    var list;
    if(type == 1){
      list = wx.getStorageSync('favorList');
      if(list){
          that.setData({
            viewMusicList:list
          })
      }else{
        //后台请求
        that.getViewMusicList(type)
      }
    }
    else if(type == 2){
        list = wx.getStorageSync('tuijianList');
        if(list){
          that.setData({
            viewMusicList:list
          })
        }else{
          //后台请求
          that.getViewMusicList(type)
        }
    }
    else{
      list = wx.getStorageSync('paihangList');
      if(list){
        that.setData({
          viewMusicList:list
        })
      }else{
        //后台请求
        that.getViewMusicList(type)
      }}
  },


  //后台请求首页展示列表
  getViewMusicList : function(type){
      var that = this;
      wx.request({
        url: 'http://localhost:5050/viewlist', //仅为示例，并非真实的接口地址
        method:'GET',
        data: {
            type:type,
            token:app.globalData.token
        },
        success (res) {
          
          
            //没有结果就直接返回
            if(res.data.totle == 0){
              that.setData({
                viewMusicList:[]
              });
              return;
            }
          var obj  = JSON.parse(res.data);
        
          var list = [];

          obj.forEach(element => {
                var pre = {};
                pre.id = element.id;
                pre.title = element.title;
                pre.singer = element.artist;
                pre.name = element.name;
                pre.src = 'http://localhost:5050/play/'+element.name;
                pre.coverImgUrl = element.coverImg;
                pre.unfavor = element.unfavor;
                list.push(pre);
              // that.data.playlist.push(pre); 
            });
    
             that.setData({
              viewMusicList:list
            })
             if(list.length > 0){
              if(type == 1){
                wx.setStorage({ key: 'favorList', data: list })
              }
              else if(type == 2){
                wx.setStorage({ key: 'tuijianList', data: list })
              }
              else if(type == 3){
                wx.setStorage({ key: 'paihangList', data: list })
              }
              
           }
          }
      })
  },

  //首页列表换曲
  viewChange : function(e){
    var that = this;
    that.setData({
      playlist : that.data.viewMusicList
    })
    // 将token保存到数据缓存（下次打开小程序无需重新获取）
    wx.setStorage({ key: 'musicList', data: that.data.viewMusicList })
    that.change(e);
    
  },
  
  //播放循环
  loopOption : function(e){
    var opt = ['single','radom','cycle'];
    var index = (e.currentTarget.dataset.index + 1)  % 3;
    this.setData({
      loop:opt[index]
    })

  },

//收藏歌曲
opFavor : function(){
  
  var unfavor = this.data.play.unfavor;
  var index = this.data.playIndex;
  var music_id = this.data.playlist[index].id;
  var that = this;
  wx.request({
    url: 'http://localhost:5050/favor',
    data:{
      unfavor:unfavor,
      music_id:music_id,
      token : app.globalData.token
    },
    method :'GET',
    success(res){
         var newfavor;
        if(res.data.result){
          var newplay = that.data.play;
          if(unfavor == 1){
            newfavor = 0;
            newplay.unfavor = newfavor;
            that.setData({
              play:newplay
            })
          }else{
            newfavor = 1
            newplay.unfavor = newfavor;
            that.setData({
              play:newplay
            })
          }
            var favorList  = wx.getStorageSync('favorList');
            var tuijianList = wx.getStorageSync('tuijianList');
            var paihangList = wx.getStorageSync('paihangList');
            if(unfavor == 0){
              var index = -1;
              for(var p in favorList){
                if(favorList[p].id == music_id){
                  index = p;break;
                }
              }
              favorList.splice(index,1);
              //在收藏页面取消收藏
              if(that.data.viewItem == 1){
                that.setData({
                  viewMusicList:favorList
                })
              }
            }
            for(var p in tuijianList){
              if(tuijianList[p].id == music_id){
                tuijianList[p].unfavor = newfavor;
                if(that.data.viewItem == 2 && unfavor == 1){
                  favorList.push(tuijianList[p]);
                }
                break;
              }
            }
            for(var p in paihangList){
              if(paihangList[p].id == music_id){
                paihangList[p].unfavor = newfavor;
                if(that.data.viewItem == 3 && unfavor == 1){
                  favorList.push(paihangList[p]);
                }
                break;
              }
            }
           
            wx.setStorage({ key: 'tuijianList', data: tuijianList })
            wx.setStorage({ key: 'paihangList', data: paihangList })
            if(that.data.viewItem == 1 && unfavor == 1){
              that.getViewMusicList(1);
            }
            //搜索结果页面添加收藏
            if(that.data.viewItem == 4 && unfavor == 1){
              for(var p in that.data.viewMusicList){
                  if(that.data.viewMusicList[p].id == music_id){
                    that.data.viewMusicList[p].unfavor = newfavor;
                    favorList.push(that.data.viewMusicList[p]);
                    break;
                  }
              }
            }
            wx.setStorage({
              data: favorList,
              key: 'favorList'
            });
            //that.opsetViewMusicList(that.data.viewItem);
           
          


        }

    }
  })
},
//歌词和封面的切换
changCoverOrLrc : function(){
    var lrcOrcover = this.data.viewLrc;
    if(lrcOrcover == 'cover'){
          this.setData({
            viewLrc:'lrc'
          })
    }else{
      this.setData({
        viewLrc:'cover'
      })
    }
},
  //歌词触碰开始
  touchstart:function(e){
    return
    console.log("触摸开始",e);
    this.setData({
      isScroll:true
    });
    isDelete=false;
    if(lineTimeId){
      clearTimeout(lineTimeId);
      lineTimeId='';
    }
  },
    //歌词触碰结束
    touchend(e){
      return
      isDelete=true;
      console.log("触摸结束",e);
      if(lineTimeId!='')return;
      lineTimeId=setTimeout(()=>{
        if(isDelete===true){
          this.setData({
            isScroll:false
          });
          lineTimeId='';
        }
      },4000);
    },
  //歌词滚动
  scroll(e){
    return;
    if(this.data.isScroll){
      let i=parseInt(e.detail.scrollTop/27);
      if(!this.data.lrcArr[i])return;//空白区域，没有时间不执行
      console.log("滚动",e.detail.scrollTop,this.data.lrcArr[i]);//歌词的间隔区间为27
      this.setData({
        locationTime:this.data.lrcArr[i],
        locationShowTime:  this.Opdate(this.data.lrcArr[i]*1000)
      });
    }
  },
  //歌词拖动播放
  playScroll(e){
    return;
    console.log("拖动播放",e);
    let value=this.data.locationTime;
   // bg.seek(value);
    this.setData({
      isScroll:false,
      isPlay:true
    });
    this.update();
  },
    //获取音乐数据
    getData:function(){
          var that = this;
      //获取歌词 
    /*     let str= "[ti:Why Don't We]"+"\n"+
        '[ar:Austin Mahone]'+"\n"+
        "[al:Why Don't We]"+"\n"+
        '[by:]'+"\n"+
        '[offset:0]'+"\n"+
        "[00:00.00]Why Don't We - Austin Mahone (奥斯汀·马洪)"+"\n"+
        "[00:08.75]Here's a situation that's been weighing on my brain"+"\n"+
        "[00:12.90]I know you've been looking for something brand new"+"\n"+
        "[00:17.18]Oh now please forgive me for what I'm about to say"+"\n"+
        "[00:21.42]Tell me baby can you baby can you"+"\n"+
        "[00:25.66]Give me one good reason why you don't give this a try"+"\n"+
        "[00:29.78]Girl there's no point in feeling guilty"+"\n"+
        "[00:33.15]Oh I'm asking can you keep a"; */
        wx.request({
          url: 'http://localhost:5050/lrc',
          method:'GET',
          data:{
            title:that.data.play.name
          },
          success(res){
            let str = res.data;
            let lrcArr=[];
            let arr=[];
            str=str.split(/\n/g);
            str.map(item=>{
              let i=item.match(new RegExp("\\[[0-9]*:[0-9]*.[0-9]*\\]","g"));
              if(i){
                i=i[0].replace('[','').replace(']','')
                let time=Number(i.split(':')[0]*60)+Number(i.split(':')[1].split('.')[0]);//毫秒：+Number(i.split(':')[1].split('.')[1]);         01:12.232  ['01','12.232'] ['12','232'] 
                // console.log(time,dayjs(time).format('mm:ss')); 
                lrcArr.push(time);
                arr.push(item.replace(new RegExp("\\[(.*)\\]","g"),""));
              }
            });
            
            //去空
            let a1=[],a2=[];
            for(let i=0;i<arr.length;i++){
              if(arr[i]&&lrcArr[i]){//当前是否有歌词
                a1.push(arr[i]);
                a2.push(lrcArr[i]);
              }
            }
            arr=a1,lrcArr=a2;
            console.log(arr);
            console.log(lrcArr);
            that.setData({
              lrc:arr,
              lrcArr:lrcArr
            });
            wx.hideLoading();
          }
        })
        
      
    },
  //定时器更新
  update: function(){
      if(this.data.state != 'running') return;

      let nowTime=this.audioCtx.currentTime;
      let totalTime=this.audioCtx.duration;
      let value=this.audioCtx.currentTime;
      let max=this.audioCtx.duration;
      if(nowTime&&totalTime){//都有数据
        //处理歌词当前位置
        // let len=0;//歌词排除为空的下标
          for(let i=0;i<this.data.lrcArr.length;i++){
            if(nowTime>this.data.lrcArr[this.data.lrcArr.length-1]){//最后的歌词
              this.setData({
                location:this.data.lrcArr.length-1
              });
              break;
            }
            
            if(nowTime>=this.data.lrcArr[i]&&nowTime<this.data.lrcArr[i+1]){
              console.log("歌词滚动");
              this.setData({
                location:i
              });
              break;
            }
          }

        //设置滚动
        if(this.data.isScroll===false){
          //超过5行开始滚动
          if(this.data.location >= 4){
            this.setData({
              locationIndex:this.data.location-3
            });
          }
        }
        //处理显示
        totalTime= this.Opdate(totalTime*1000);
        nowTime=this.Opdate(nowTime*1000);
        console.log("时间2：",totalTime,nowTime);
        this.setData({
          nowTime:nowTime,
          totalTime:totalTime,
          max:max,
          value:value
        });
      }
  },
  //搜索音乐
  searchMusic:function(e){
    
    var value = e.detail.value;
    e.detail.value = ''
    var that = this;
    wx.request({
      url: 'http://localhost:5050/search',
      method:'GET',
      data:{
        key :value
      },
      
      success(res){
        that.setData({
          viewItem:4
        })
        that.setData({
          item: 0,
        })
        //没有结果就直接返回
        if(res.data.totle == 0){
          that.setData({
            viewMusicList:[]
          });
          return;
        }
      var obj  = JSON.parse(res.data);
    
      var list = [];

      obj.forEach(element => {
            var pre = {};
            pre.id = element.id;
            pre.title = element.title;
            pre.singer = element.artist;
            pre.name = element.name;
            pre.src = 'http://localhost:5050/play/'+element.name;
            pre.coverImgUrl = element.coverImg;
            pre.unfavor = element.unfavor;
            list.push(pre);
          // that.data.playlist.push(pre); 
        });

         that.setData({
          viewMusicList:list
        })
      }
    })

    return {value:''}
  },
 
    //时间处理函数
    Opdate : function(ss){
      var newdate = new Date(ss);
      var mm = newdate.getMinutes();
      mm = '0'+mm;
      var ss = newdate.getSeconds();
      if(ss < 10){
        ss = '0'+ss;
      }
      return mm + ':'+ss;
    }

})