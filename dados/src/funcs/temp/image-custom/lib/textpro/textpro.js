"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.textpro = void 0;
exports.textpro = function (string, { type, headers = {} }) {
	const cheerio = require('cheerio');
	const selectTextPro = require('./type.js')
	const strings = (typeof string == 'object' ? string : string.split('/')).filter(v => v.length)
    const url = selectTextPro(type);
    if (!url) return Promise.reject('Opção errada!')
    
    Object.assign(headers, {
    	Referer: url
	})
    return this.getHTML(url, {
		method: "GET",
		followAllRedirects: true,
		headers
	}).then(html => {
		const $ = cheerio.load(html);
		const servidor = $('#build_server').val()
		const servidorId = $('#build_server_id').val()
		const token = $('#token').val()
		const radio0 = [];
		const radio1 = [];
		$('.item-input').each((i, elem) => {
            $(elem).find("#select_option_wrapper > label").each((v, eleme) => {
            	(/radio0/.test($(eleme).attr("for")) ? radio0 : radio1).push($(eleme).find('input').val())
            });
		});
		return this.getHTML(url, {
			method: "POST",
			followAllRedirects: true,
			headers: Object.assign(headers, {
				Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7'
			}),
			form: {
				'autocomplete0': '',
				...(radio0.length ? { 'radio0[radio]': this.random(radio0) } : {}),
				...(radio1.length ? { 'radio1[radio]': this.random(radio1) } : {}),
				'text': strings,
				'submit': 'GO',
				'token': token,
				'build_server': servidor,
				'build_server_id': Number(servidorId)
			}
		}).then(html => {
			const $ = cheerio.load(html);
			return this.getHTML('https://textpro.me/effect/create-image', {
				method: "POST",
				followAllRedirects: true,
				headers,
				form: JSON.parse($('#form_value').first().text())
			}).then(({ image, success }) => {
				if (!success) return Promise.reject('Não obtive resposta.')
						
				return Promise.resolve(servidor + image);
			});
		});
	});
}