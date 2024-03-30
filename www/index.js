window.addEventListener('load', function (event) {
	const $breadcrumbs = document.querySelector('#content #breadcrumbs')
	const $filelist = document.querySelector('#content #filelist')
	const $dialog = document.querySelector('#content #dialog')
	const $log = document.querySelector('#content #log')
	const $filename = $dialog.querySelector('#filename')
	const $details = $dialog.querySelector('#details')
	const $streams = $dialog.querySelector('#streams')
	const $options = $dialog.querySelector('#options')
	const $command = $dialog.querySelector('#command')

	$breadcrumbs.addEventListener('click', function (evt) {
		const $e = evt.target
		let $next
		while ($next = $e.nextElementSibling)
			$next.remove()
		updateFilelist($e.getAttribute('path'))
	})

	async function showFileDialog(path) {
		backToDialog()

		const info = await fetch ('/api/info.cgi?path=' + path).then(res => res.json())
		console.log(info)

		function caption(e) {
			let res = e.codec_type + ': '  + e.codec_name
			if (e.codec_type == 'audio') 
				res += ' / ' + e.channel_layout

			if (e.tags && e.tags.language) 
				res += ' / ' + e.tags.language

			if (e.codec_type == 'video') 
				res += ' / ' + e.width + 'x' + e.height

			return res
		}

		function updateCommand () {
			const audioCodec = $options.querySelector('#options #audio_codec').value
			let targetPath = $filename.getAttribute('path').split('.').slice(0, -1).join('.') + '.' + $options.querySelector('#options #container').value
			if (path == targetPath)
				targetPath = $filename.getAttribute('path').split('.').slice(0, -1).join('.') + '(repack).' + $options.querySelector('#options #container').value

			$command.value = 'ffmpeg -y -hide_banner -i "' + path.substring(1) + '"' + 
				[...$streams.querySelectorAll('input[type="checkbox"]')].map($e => ' -map ' + ($e.checked ? '' : '-') + '0:' + $e.getAttribute('index')).join('') + 
				' -c:v copy -c:s copy -c:a ' + audioCodec + ' "' + targetPath.substring(1) + '"'
		}

		$streams.innerHTML = info.streams.map(e => 
			`<div>
				<input type = "checkbox" id = "stream-${e.index}" index = "${e.index}" checked>
				<label for = "stream-${e.index}" title = "${e.codec_long_name}">${caption(e)}</label>
			</div>`
		).join('')

		$filename.textContent = path.split(/(\\|\/)/g).pop()
		$filename.setAttribute('path', path)

		function toSize(size) {
			const i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024))
			return (size / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i]
		}

		function toTime(sec) {
			const date = new Date(0)
			date.setSeconds(sec)
			return date.toISOString().substr(11, 8)
		}

		$details.innerHTML = '<span>Duration: ' + toTime(parseInt(info.format.duration)) + '</span><span>FileSize: ' + toSize (info.format.size) + '</span>'

		$dialog.querySelectorAll('input[type="checkbox"], select').forEach($e => $e.addEventListener('change', updateCommand))
		updateCommand ()
	}

	async function updateFilelist(dir) {
		try {
			const data = await fetch ('/api/list.cgi?path=' + dir).then(resp => resp.json())
			
			function addListeners ($e) {
				const isFile = $e.getAttribute('is-file') == 'true'
				const path = dir + $e.querySelector('#name').textContent

				const onFolderClick = evt => {
					$breadcrumbs.insertAdjacentHTML('beforeend', `<div path = "${path}">${$e.textContent.slice(0, -1)}</div>`);
					updateFilelist(path)
				}
				const onFileClick = evt => evt.target.id != 'remove' && showFileDialog(path)
				
				$e.addEventListener('click', isFile ? onFileClick : onFolderClick)

				if (isFile) {	
					$e.querySelector('#remove').addEventListener('click', async _ => {
						await fetch('/api/rm.cgi?path=' + path)
							.then(resp => resp.text())
							.then(console.log)

						$e.remove()
					})
				}
			}

			function toHtml(e) {
				const isFile = e.slice(-1) != '/'
				const btn = isFile ? `<span id = "remove" title = "Delete file">x</span>` : ''
				return `<div is-file = "${isFile}"><span id = "name">${e}</span>${btn}</div>`
			}
			
			$filelist.innerHTML = data.map(toHtml).join('')	
			Array.from($filelist.children).forEach(addListeners)
				
		} catch (err){
			console.error(err)
			$filelist.innerHTML = `<div>${err.message}</div>`	
		}
	}

	function backToList(reload) {
		if (reload)
			$breadcrumbs.querySelector('div:last-of-type').click()
		$breadcrumbs.hidden = false
		$filelist.hidden = false
		$dialog.hidden = true
		$log.hidden = true
	}

	function backToDialog() {
		$breadcrumbs.hidden = true
		$filelist.hidden = true
		$dialog.hidden = false
		$log.hidden = true
	}

	$dialog.querySelector('#button-cancel').addEventListener('click', backToList)

	$dialog.querySelector('#button-ok').addEventListener('click', function (evt) {
		$breadcrumbs.hidden = true
		$filelist.hidden = true
		$dialog.hidden = true
		$log.hidden = false

		const $output = $log.querySelector('#output')

		fetch('/api/ffmpeg.cgi?cmd=' + $command.value)
			.then(resp => resp.body)
			.then(async body => {
				const reader = body.getReader()
				const utf8Decoder = new TextDecoder()
				let nextChunk
				
				while (!(nextChunk = await reader.read()).done) {
					const partialData = utf8Decoder.decode(nextChunk.value)
					$output.textContent += partialData
					$output.scrollTop = $output.scrollHeight
				}

				$output.textContent += '\n\nFINISHED'
				$output.scrollTop = $output.scrollHeight

			})
	})

	$log.querySelector('#button-list').addEventListener('click', _ => backToList(true))

	$log.querySelector('#button-file').addEventListener('click', backToDialog)

	updateFilelist('/')
})