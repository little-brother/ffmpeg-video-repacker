#!/usr/bin/haserl --shell=lua
Content-type: text/html

<% 
io.write(GET.cmd .. '\n\n')
local f = io.popen('cd /mnt/media && ' .. GET.cmd)
for f in f:lines() do
	io.write(f .. '\n')
end
f:close()
%>
