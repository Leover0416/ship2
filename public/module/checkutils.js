var checkutils = {
	//ip地址校验
	isValidIP:function(ip){
		var regIP = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/
		return regIP.test(ip);
	},
	//正整数
	isPositiveInt: function(s){//是否为正整数
		var re = /^[0-9]+$/ ;
		return re.test(s)
	},
	//1-1023
	from1To1023Int: function(s){
		if(s >= 1 && s <= 1023){
			return true;
		}
		return false;
	},
	//1-12
	from1To12Int: function(s){
		if(s >= 1 && s <= 12){
			return true;
		}
		return false;
	},
	//1-31
	from1To31Int: function(s){
		if(s >= 1 && s <= 31){
			return true;
		}
		return false;
	},
	//0-23
	from0To23Int: function(s){
		if(s >= 0 && s <= 23){
			return true;
		}
		return false;
	},
	//0-59
	from0To59Int: function(s){
		if(s >= 0 && s <= 59){
			return true;
		}
		return false;
	},
	//0-127
	from0To127Int: function(s){
		if(s >= 0 && s <= 127){
			return true;
		}
		return false;
	},
	//-180-+180
	from180To180Int: function(s){
		if(s >= -180 && s <= 180){
			return true;
		}
		return false;
	},
	//-90-+90
	from90To90Int: function(s){
		if(s >= -90 && s <= 90){
			return true;
		}
		return false;
	},
	//0-126
	from0To126Int: function(s){
		if(s >= 0 && s <= 126){
			return true;
		}
		return false;
	},
	//0-359
	from0To359Int: function(s){
		if(s >= 0 && s <= 359){
			return true;
		}
		return false;
	},
	//-60-+600
	from60To600Int: function(s){
		if(s >= -60 && s <= 600){
			return true;
		}
		return false;
	},
	//0-100
	from0To100Int: function(s){
		if(s >= 0 && s <= 100){
			return true;
		}
		return false;
	},
	//-200-+500
	from200To500Int: function(s){
		if(s >= -200 && s <= 500){
			return true;
		}
		return false;
	},
	//1-402
	from1To402Int: function(s){
		if(s >= 1 && s <= 402){
			return true;
		}
		return false;
	},
	//0-4000
	from0To4000Int: function(s){
		if(s >= 0 && s <= 4000){
			return true;
		}
		return false;
	},
	//0-251
	from0To251Int: function(s){
		if(s >= 0 && s <= 251){
			return true;
		}
		return false;
	},
	//0-30
	from0To30Int: function(s){
		if(s >= 0 && s <= 30){
			return true;
		}
		return false;
	},
	//0-60
	from0To60Int: function(s){
		if(s >= 0 && s <= 60){
			return true;
		}
		return false;
	},
	//-100-+500
	from100To500Int: function(s){
		if(s >= -100 && s <= 500){
			return true;
		}
		return false;
	},
	//0-501  511
	from0To511Int: function(s){
		if(s >= 0 && s <= 511){
			return true;
		}
		return false;
	},
	//1~262142
	from0To262142Int: function(s){
		if(s >= 1 && s <= 262142){
			return true;
		}
		return false;
	},
	//1-511
	from1To511Int: function(s){
		if(s >= 1 && s <= 511){
			return true;
		}
		return false;
	},
	//1-255
	from1To255Int: function(s){
		if(s >= 1 && s <= 255){
			return true;
		}
		return false;
	},
	//0-4
	from0To4Int: function(s){
		if(s >= 0 && s <= 4){
			return true;
		}
		return false;
	},
	//0-4095
	from1To4095Int: function(s){
		if(s >= 0 && s <= 4095){
			return true;
		}
		return false;
	},
	//1-255000
	from1To255000Int: function(s){
		if(s >= 1 && s <= 255000){
			return true;
		}
		return false;
	},
	//1-359
	from1To359Int: function(s){
		if(s >= 1 && s <= 359){
			return true;
		}
		return false;
	},
	//0-719
	from0To719Int: function(s){
		if(s >= 0 && s <= 719){
			return true;
		}
		return false;
	},
	//6比特ASCII
	bitASCII: function(s){
		var msgArr = s.split('');
		for(var i in msgArr){
			if(msgArr[i].charCodeAt() < 32 || msgArr[i].charCodeAt() > 95){
				return false;
			}
		}
		return true;
	},
	//ASCII
	normalASCII: function(s){
		var msgArr = s.split('');
		for(var i in msgArr){
			if(msgArr[i].charCodeAt() < 0 || msgArr[i].charCodeAt() > 126){
				return false;
			}
		}
		return true;
	},
	//0-63
	from0To63Int: function(s){
		if(s >= 0 && s <= 63){
			return true;
		}
		return false;
	},
}