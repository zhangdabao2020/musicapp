
App({
   onLaunch: function () {
     //设置缓存过期时间
     var storyDate = wx.getStorageSync('storyDate');
     if(storyDate){
          this.oPstoryClean(storyDate);
     }else{
       var mydate = new Date().toLocaleDateString();
       var date1 = new Date(mydate)
       wx.setStorage({
         data: date1,
         key: 'storyDate',
       })
     }
    this.checkLogin(res => {
      console.log('is_login: ', res.is_login)
      if (!res.is_login) {
        this.login()
      }
    })
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 执行到此处表示用户已经授权，可以直接获取到用户信息

          wx.getUserInfo({
            success: res => {
              console.log(res)
              console.log(res.userInfo)
              this.globalData.userInfo = res.userInfo
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })

  }, 


  login: function () {
    wx.login({
      success: res => {
        console.log('login code: ' + res.code)
        wx.request({
          url: 'http://localhost:5050/login',
          method: 'post',
          data: { code: res.code },
          success: res => {
            console.log('token: ' + res.data.token)
            // 将token保存为公共数据（用于在多页面中访问）
            this.globalData.token = res.data.token
            // 将token保存到数据缓存（下次打开小程序无需重新获取token）
            wx.setStorage({ key: 'token', data: res.data.token })
          }
        })
      }
    })
  },


  //检查是否已经登录
   checkLogin: function (callback) {
    var token = this.globalData.token
    if (!token) {
      // 从数据缓存中获取token
      token = wx.getStorageSync('token')
      if (token) {
        this.globalData.token = token
      } else {
        callback({ is_login: false })
        return
      }
    }
    wx.request({
      url: 'http://localhost:5050/checklogin',
      data: { token: token },
      success: res => {
        
        console.log(res.data.is_login)
        callback({ is_login: res.data.is_login })
      }
    })
  }, 

  

 //判断是否清理缓存
 oPstoryClean : function(storyDate){
      var newMydate = new Date().toLocaleDateString();
      var date2 = new Date(newMydate);
      var differInTime = date2.getTime() - storyDate.getTime();
      var differInDay = differInTime / (1000 * 3600 * 24);
      if(differInDay >= 1){
        wx.removeStorageSync('favorList');
        wx.removeStorageSync('tuijianList');
        wx.removeStorageSync('paihangList');
      }
},

  //存储全局数据
  globalData: {
    userInfo: null,

    token: null	// 保存token

  }
})