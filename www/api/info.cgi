#!/usr/bin/haserl --shell=lua
Content-type: application/json

<% 
local path = '/mnt/media' .. (GET.path or '/') 
local f = io.popen('ffprobe -v quiet -print_format json -show_format -show_streams "' .. path .. '"')
local result = f:read("*a")
f:close()

io.write(result)
%>
