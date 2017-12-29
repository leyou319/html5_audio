(function(){

	var audio = {
		el: $('#audio'),
		lyric: [],
		init: function(){
			this.bindEvent();
			this.getLyric(this.el.src.replace('.mp3', '.lrc'));
		},
		bindEvent: function(){
			var self = this, endTime;

			this.el.addEventListener('loadstart', function(){
				$('.song_handle').classList.remove('play');
				$('.song_handle').classList.add('loading');
			});

			this.el.addEventListener('canplay', function(){
				endTime = this.duration;
				$('.end_time').textContent = self.formatTime(endTime);
				$('.song_handle').classList.remove('loading');
				$('.song_handle').classList.add('play');
				this.play();				
				self.handleProgress(endTime); // 可以播放的时候才能操作进度条
			});
			
			this.el.addEventListener('timeupdate', function(){
				var curTime = this.currentTime;				
				self.syncLyric(self.lyric, curTime);
				self.syncProgress(curTime, endTime);
			});

			this.el.addEventListener('ended', function(){
				this.play();
			});

			$('.song_handle').addEventListener('click', function(){
				var flag = this.classList.contains('play');
				if (flag) {
					this.classList.remove('play');
					this.classList.add('pause');
					self.el.pause();
				}else {
					this.classList.remove('pause');
					this.classList.add('play');
					self.el.play();
				}
			});

			// 处理audio不能自动播放问题
			document.addEventListener('DOMContentLoaded', function(){
				self.el.play();
			});

			document.addEventListener('WeixinJSBridgeReady', function(){
				self.el.play();
			});
		},
		getLyric: function(url){
			var req = new XMLHttpRequest(),
				text = '',
				self = this;
			req.open('get', url, true);
			req.send();
			req.onreadystatechange = function(){
				if (req.readyState == 4 && req.status == 200) {
					text = req.responseText;
					self.lyric = self.parseLyric(text);
					self.appendLyric(self.lyric);
				}
			}
		},
		parseLyric: function(text){
			//将文本分隔成一行一行，存入数组
		    var lines = text.split('\n'),
		        //用于匹配时间的正则表达式，匹配的结果类似[xx:xx.xx]
		        pattern = /\[\d{2}:\d{2}.\d{2}\]/g,
		        //保存最终结果的数组
		        result = [];
		    //去掉不含时间的行
		    while (!pattern.test(lines[0])) {
		        lines = lines.slice(1);
		    };
		    //上面用'\n'生成生成数组时，结果中最后一个为空元素，这里将去掉
		    lines[lines.length - 1].length === 0 && lines.pop();
		    lines.forEach(function(v /*数组元素值*/ , i /*元素索引*/ , a /*数组本身*/ ) {
		        //提取出时间[xx:xx.xx]
		        var time = v.match(pattern),
		            //提取歌词
		            value = v.replace(pattern, '');
		        //因为一行里面可能有多个时间，所以time有可能是[xx:xx.xx][xx:xx.xx][xx:xx.xx]的形式，需要进一步分隔
		        time.forEach(function(v1, i1, a1) {
		            //去掉时间里的中括号得到xx:xx.xx
		            var t = v1.slice(1, -1).split(':');
		            //将结果压入最终数组
		            result.push([parseInt(t[0], 10) * 60 + parseFloat(t[1]), value]);
		        });
		    });
		    //最后将结果数组中的元素按时间大小排序，以便保存之后正常显示歌词
		    result.sort(function(a, b) {
		        return a[0] - b[0];
		    });
		    return result;
		},
		appendLyric: function(lyric){
			var $lyric = $('#lyric'),
				fragment = document.createDocumentFragment();
			$lyric.innerHTML = '';
			lyric.forEach(function(v, i){
				var p = document.createElement('p');
				p.id = 'line-' + i;
				p.textContent = v[1];
				fragment.appendChild(p);
			});
			$lyric.appendChild(fragment);			
		},
		syncLyric: function(lyric, curTime){
			var $lyric = $('#lyric');
			$('.start_time').textContent = this.formatTime(curTime);
			lyric.forEach(function(v, i){
				if (curTime > v[0]) {
					$('#line-'+ (i>0 ? i-1 : i)).classList.remove('current');
					$('#line-'+ i).classList.add('current');
					$lyric.style.transform = 'translate3d(0,-'+ 42*i +'px,0)';
				}
			});
		},
		syncProgress: function(curTime, endTime){
			var percent = parseInt(curTime/endTime * 100) + '%';
			$('.progress .current').style.width = percent;
		},
		handleProgress: function(duration){
			if (!duration) return;
			var $progress = $('.progress'),
				$btn = $('.progress .btn_handle'),
				$shandle = $('.song_handle'),
				min = $progress.offsetLeft,
				max = $progress.offsetWidth,
				diff = 0,
				self = this;

			$btn.addEventListener('touchstart', function(e){
				e.preventDefault();
				self.el.pause();
				$shandle.classList.remove('play');
				$shandle.classList.add('pause');
			});

			$btn.addEventListener('touchmove', function(e){
				e.preventDefault();
				var touch = e.touches[0];
				diff = touch.pageX - min;
				if (diff > 0) {
					$btn.parentNode.style.width = diff/max*100 +'%';
					if (diff > max) {
						$btn.parentNode.style.width = 100 +'%';
					}
				}else {
					$btn.parentNode.style.width = 0;
				}
			});

			$btn.addEventListener('touchend', function(e){
				e.preventDefault();
				self.el.currentTime = diff/max*duration;
				self.removeClass();
				self.el.play();
				$shandle.classList.remove('pause');
				$shandle.classList.add('play');
			});
		},
		removeClass: function(){
			var $$p = $$('#lyric p');
			for (var i = $$p.length - 1; i >= 0; i--) {
				$$p[i].classList.remove('current');
			}
		},
		formatTime: function(second){
			var time = '',
				minute = parseInt(second / 60);
			second = parseInt(second % 60);
			if (minute < 10) minute = '0'+ minute;
			if (second < 10) second = '0'+ second;			
			time = minute +':'+ second;
			return time;
		}
	};

	audio.init();

	function $(str){
		return typeof str == 'string' ? document.querySelector(str) : null;
	}

	function $$(str){
		return typeof str == 'string' ? document.querySelectorAll(str) : null;
	}

})();