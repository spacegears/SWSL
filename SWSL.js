// Steam Workshop Subscriptions Scraper by Bryn "BrynM" Mosher
// https://gist.github.com/BrynM/c1b49804e53d7c406143a9ae40ed65ad

(function() {
	// --- SETTINGS ---

	var autoNavigation = true;
	var debugMode = true;
	var pageWait = 2;
	var timestampFileNames = false;
	var lineEnding = '\r\n'; // '\n' for "Unix" newlines and '\r\n' for Windowss newlines

	// --- END SETTINGS ---

	function createFileLink (contEle, saveType, allData) {
		const deets = getSaveDetails(saveType);
		const upperName = deets.typeName.toUpperCase();
		dbgMsg(upperName, 'file details:', deets);
		
		const eleId = scriptName+'-'+deets.typeName+'-download';
		let newEle = document.querySelector('#'+eleId);
		if (newEle) {
			contEle.removeChild(newEle);
		}
		newEle = document.createElement('a');
		newEle.id = eleId;
		newEle.style = linkStyle;
		newEle.innerText = 'Download '+upperName;
		newEle.href = 'data:'+deets.type+';charset=utf-8,'+encodeURIComponent(dataToType(deets.typeName, allData));
		newEle.target = '_blank';
		newEle.download = deets.file;
		contEle.appendChild(newEle);
		dbgMsg('Created '+upperName+' link', eleId, newEle);
	}

	function dataFromStorage () {
		const firstPage = 1;
		const lastPage = getLastPage();
		const prefix = getStoragePrefix();
		let allData = [];
		let currData = null;
		for(var iter = firstPage; iter <= lastPage; iter++) {
			let storageKey = prefix+iter;
			dbgMsg('Checking storage for', storageKey);
			currData = JSON.parse(localStorage.getItem(storageKey));
			if (!currData) {
				logMsg('Warning! No data found in storage for key', storageKey);
				continue;
			}
			currData.map(item => {
				allData.push(item);
			});
		}

		return allData;
	}

	function dataToCsv (data) {
		dbgMsg('Generating CSV output for', data.length, 'items');
		let output = [
			'"Item Name", "Item Link", "Item Thumb"',
		];

		data.map(item => {
			output.push('"'+item.title+'","'+item.link+'","'+item.thumb+'"');
		});

		return output.join(lineEnding);
	}

	function dataToHtml (data) {
		dbgMsg('Generating HTML output for', data.length, 'items');
		output = [
			'<html>',
			'<head>',
			'<Title>',
			appName+' ('+appId+')',
			'Subscribed Steam Workshop Items',
			'for '+appUser,
			'</Title>',
			'</head>',
			'<body style="'+htmlBodyStyle+'">',
			'<h1 style="'+htmlHeaderStyle+'">',
			appName+' ('+appId+')',
			'Subscribed Steam Workshop Items',
			'for '+appUser,
			'</h1>',
			'<table style="'+htmlTableStyle+'">',
		];

		data.map(item => {
			output.push('<tr style="'+htmlTrStyle+'">');
			output.push('<td style="'+htmlTdThumbStyle+'"><a href="'+item.thumb+'" target="_blank"><img src="'+item.thumb+'" alt="'+item.title+'" title="click to view '+item.title+' thumbnail..." style="'+htmlThumbStyle+'"></a></td>');
			output.push('<td style="'+htmlTdLinkStyle+'"><a href="'+item.link+'" target="_blank" style="'+htmlLinkStyle+'">'+item.title+'</a></td>');
			output.push('</tr>');
		});

		output.push('</table>');
		output.push('</body>');
		output.push('</html>');
		return output.join(lineEnding);
	}

	function dataToJson (data) {
		dbgMsg('Generating JSON output for', data.length, 'items');
		return JSON.stringify(data, null, '\t');
	}

	function dataToTxt (data) {
		dbgMsg('Generating TXT output for', data.length, 'items');
		let output = [
			'- Subscribed Steam Workshop Items',
			'- '+appName+' ('+appId+')',
			'- Steam User: '+appUser,
			'- Total Items: '+data.length,
			'', //empty newline
		];

		data.map(item => {
			itemDetails = [
				'Name: '+item.title,
				'Link: '+item.link,
				'Thumbnal Link: '+item.thumb,
			];
			output.push(itemDetails.join(lineEnding));
			output.push(''); // extra newline
		});
		return output.join(lineEnding);
	}

	function dataToType (saveType, data) {
		outputData = null;

		switch (saveType) {
			case 'csv':
				outputData = dataToCsv(data);
				break;
			case 'html':
				outputData = dataToHtml(data);
				break;
			case 'json':
				outputData = dataToJson(data);
				break;
			case 'txt':
				outputData = dataToTxt(data);
				break;
			default:
				break;
		}
		return outputData;
	}

	function dbgMsg () {
		if (debugMode) {
			let args = Array.prototype.slice.call(arguments);
			args.unshift('DEBUG');
			logMsg.apply(this, args);
		}
	}

	function getQueryStrings () {
		let queryString = {};
		location.search.replace(/^\?/, '').split('&').map(chunk => {
			let keyVal = chunk.split('=');
			queryString[keyVal[0]] = keyVal[1];
		});
		return queryString;
	}

	function getAppId () {
		return getQueryStrings()['appid'];
	}

	function getAppName () {
		let navEles = document.querySelectorAll('.HeaderUserInfoSection');
		return navEles[navEles.length - 1].innerText;
	}

	function getCurrPage () {
		return parseInt(getQueryStrings()['p'], 10);
	}

	function getCurrSubscribed () {
		const currElements = Array.prototype.slice.call(document.querySelectorAll('.workshopItemSubscription[id^="Subscr"]'));
		let currDetails = currElements.map(function(ele) {
			const titleEle = ele.querySelector('.workshopItemTitle');
			const thumbEle = ele.querySelector('.workshopItemPreviewImage');
			const titleLink = ele.querySelector('.workshopItemSubscriptionDetails > a');

			return {
				'title': titleEle.innerText,
				'link': titleLink.getAttribute('href'),
				'thumb': thumbEle.getAttribute('src').replace(/\?.*/, ''),
			};
		});
		const details = currDetails.filter(item => {
			if (!item) return false;
			return item.link.includes('/steamcommunity.com/');
		});
		return details;
	}

	function getLastPage () {
		// this is flimsy...
		const pageLinks = document.querySelectorAll('.workshopBrowsePagingControls')[0].querySelectorAll('.pagelink');
		const lastP = parseInt(pageLinks[pageLinks.length - 1].innerText, 10);
		const currP = getCurrPage();
		// Have to account for the selector missing the last page.
		return currP > lastP ? currP : lastP;
	}

	function getSaveDetails (saveType) {
		let fileExt = '.txt';
		let fileType = 'text/plain';
		let typeName = 'txt';

		switch (saveType) {
			case 'csv':
				fileExt = '.csv';
				fileType = 'application/csv';
				typeName = 'csv';
				break;
			case 'html':
				fileExt = '.html';
				fileType = 'text/html';
				typeName = 'html';
				break;
			case 'json':
				fileExt = '.json';
				fileType = 'application/json';
				typeName = 'json';
				break;
			default:
				break;
		}

		fileName = appName.replace(/[^A-Za-z0-9_\-]/, '')+' ('+appId+') Subscribed Workshop Items for '+appUser;
		if (timestampFileNames) {
			fileName += ' '+(new Date().valueOf());
		}
		fileName += fileExt;

		return {
			'ext': fileExt,
			'type': fileType,
			'typeName': typeName,
			'file': fileName,			
		};
	}

	function getStoragePrefix () {
		return scriptName+'-subscribed-'+getAppId()+'-p';
	}

	function getUser () {
		return document.querySelector('#account_pulldown').innerText;
	}

	function goToNextPage () {
		const currPage = getCurrPage();
		const remaining = parseInt(getLastPage() - currPage, 10);
		if (remaining > 0) {
			if (!autoNavigation) {
				logMsg('Automatic navigation is off. You must load the next page manually.');
				return;
			}
			const newUri = document.location.toString().replace('&p='+currPage, '&p='+(currPage + 1))
			logMsg('Navigating in '+pageWait+' seconds. Reload the page to abort. Next page is located at "'+newUri+'"');
			setTimeout(function() {
				logMsg('Navigating to "'+newUri+'"');
				document.location = newUri;
			}, pageWait * 1000);
		} else {
			logMsg('Last page reached. Begining storage dump of pages.');
			setupFinishLinks()
		}
	}

	function logMsg () {
		let args = Array.prototype.slice.call(arguments);
		args.unshift('# '+scriptName+':');
		console.log.apply(console, args);
	}

	function processSubs () {
		dbgMsg('Found AppId:', appId);
		const currPage = getCurrPage();
		dbgMsg('Current Page:', currPage);
		const lastPage = getLastPage();
		dbgMsg('Remaining Pages:', lastPage - currPage);
		const pageSubscribedItemList = getCurrSubscribed();
		dbgMsg('Subscribed Items Found:', pageSubscribedItemList);
		const storageName = getStoragePrefix()+currPage;
		dbgMsg('Saving workshop items page to localStorage as', storageName);
		localStorage.setItem(storageName, JSON.stringify(pageSubscribedItemList));
		if (pageSubscribedItemList.length > 0) {
			goToNextPage();
		}
	}

	function setupFinishLinks () {
		const allData = dataFromStorage();
		dbgMsg('Retrieved data from storage.', allData);

		const contEleId = scriptName+'-container';
		let contEle = document.querySelector('#'+contEleId);
		if (!contEle) {
			contEle = document.createElement('div');
			contEle.id = contEleId;
			document.querySelector('body').appendChild(contEle);
		}
		contEle.style = containerStyle;
		contEle.innerHTML = '';

		const headerEleId = scriptName+'-header';
		let headerEle = document.createElement('span');
		headerEle.id = contEleId;
		headerEle.innerHTML = scriptName+' download links for:<br><strong>'+appName+'</strong>';
		contEle.appendChild(headerEle);
		headerEle.style = headerStyle;
		contEle.appendChild(headerEle);
		dbgMsg('Created container', contEleId, contEle);

		createFileLink(contEle, 'html', allData);
		createFileLink(contEle, 'csv', allData);
		createFileLink(contEle, 'json', allData);
		createFileLink(contEle, 'txt', allData);
	}

	var scriptName = 'SWSScrape';
	var appName = getAppName();
	var appId = getAppId();
	var appUser = getUser();
	var containerCsss = [
		'display: block',
		'position:fixed',
		'top:0',
		'bottom:0',
		'min-height: 100px',
		'min-width: 100px',
		'margin: 10px',
		'padding: 10px',
		'text-align: center',
		'border:5px solid blue',
		'z-index:500',
		'background: black',
		'opacity: 85%',
	];
	var containerStyle = containerCsss.join(';');
	var headerCsss = [
		'display: block',
		'margin: 0',
		'padding: 0',
		'padding-bottom: 5px',
		'width: 100%',
		'text-align: center',
		'color: white',
	];
	var headerStyle = headerCsss.join(';');
	var linkCss = [
		'display: block',
		'padding: 5px',
		'margin: 5px',
		'margin-bottom: 0px',
		'text-align: center',
		'background: red',
		'color: black',
		'font-weight: bold',
		'z-index:500',
	];
	var linkStyle = linkCss.join(';');

	var htmlBodyCss = [
		'width:100%',
		'background: black',
	];
	var htmlBodyStyle = htmlBodyCss.join(';');
	var htmlHeaderCss = [
		'color: white',
		'margin: 10px auto',
		'width:95%',
	];
	var htmlHeaderStyle = htmlHeaderCss.join(';');
	var htmlTableCss = [
		'margin: 10px auto',
		'width:95%',
	];
	var htmlTableStyle = htmlTableCss.join(';');
	var htmlTdLinkCss = [
		'background: rgba( 84, 133, 183, 0.2)',
		'padding: 10px',
		'padding-top: 0px',
	];
	var htmlTdLinkStyle = htmlTdLinkCss.join(';');
	var htmlTdThumbCss = [
	];
	var htmlTdThumbStyle = htmlTdThumbCss.join(';');
	var htmlTrCss = [
	];
	var htmlTrStyle = htmlTrCss.join(';');
	var htmlLinkCss = [
		'color: white',
		'font-weight: bold',
	];
	var htmlLinkStyle = htmlLinkCss.join(';');
	var htmlThumbCss = [
		'max-height: 200px',
		'max-width: 200px',
		'border:none',
	];
	var htmlThumbStyle = htmlThumbCss.join(';');

	processSubs();
})();
