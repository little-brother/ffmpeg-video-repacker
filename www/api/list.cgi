#!/usr/bin/haserl --shell=lua
Content-type: application/json

<% 
local json = require "libs/json"

local dir = '/mnt/media' .. (GET.path or '/') 
local result = {}
local files = io.popen('ls -p "' .. dir .. '" --group-directories-first')

for file in files:lines() do
	local ext = file:match("^.+(%..+)$") or ''
	if (string.find('.avi,.mkv,.mp4,.m4v,.wmv', ext) or string.sub(file, -1) == '/') then
		table.insert(result, file)
	end
end
files:close()

io.write(json.encode(result))
%>
