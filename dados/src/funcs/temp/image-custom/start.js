"use strict";
Object.defineProperty(module.exports, "__esModule", { value: true });
module.exports = void 0;
module.exports = class Image {
	constructor() {
		const lib = require('./lib')
		Object.assign(this, lib)
	}
	
	getHTML(url, config = {}) {
		return new Promise((resolve, reject) => {
			const request = require('request');
			request({
				url,
				...config
			}, (error, res, body) => {
				if (error) return reject(error);
				try {
					body = JSON.parse(body);
				} catch { }
				
				resolve(body);
			});
		});
    };
    
    getDate() {
		return String(Date.now()).slice(0, 10)
	};
	
    gerarPHPSESSID(tamanho = 32) {
    	const crypto = require("crypto");
		const caracteresValidos = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		let phpSessId = '';
		for (let i = 0; i < tamanho; i++) {
			const indiceAleatorio = crypto.randomInt(0, caracteresValidos.length);
			phpSessId += caracteresValidos.charAt(indiceAleatorio);
		}
		return phpSessId;
	};
	
    userAgent() {
		const oos = [ 'Macintosh; Intel Mac OS X 10_15_7', 'Macintosh; Intel Mac OS X 10_15_5', 'Macintosh; Intel Mac OS X 10_11_6', 'Macintosh; Intel Mac OS X 10_6_6', 'Macintosh; Intel Mac OS X 10_9_5', 'Macintosh; Intel Mac OS X 10_10_5', 'Macintosh; Intel Mac OS X 10_7_5', 'Macintosh; Intel Mac OS X 10_11_3', 'Macintosh; Intel Mac OS X 10_10_3', 'Macintosh; Intel Mac OS X 10_6_8', 'Macintosh; Intel Mac OS X 10_10_2', 'Macintosh; Intel Mac OS X 10_10_3', 'Macintosh; Intel Mac OS X 10_11_5', 'Windows NT 10.0; Win64; x64', 'Windows NT 10.0; WOW64', 'Windows NT 10.0' ];

		return `Mozilla/5.0 (${oos[Math.floor(Math.random() * oos.length)]}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${Math.floor(Math.random() * 3) + 87}.0.${Math.floor(Math.random() * 190) + 4100}.${Math.floor(Math.random() * 50) + 140} Safari/537.36`;
	};
	
	random(array) {
		return array[Math.floor(Math.random() * array.length)];
	};
}