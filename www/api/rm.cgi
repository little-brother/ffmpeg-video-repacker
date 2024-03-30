#!/usr/bin/haserl --shell=lua
Content-type: text/html

<% 
local cmd = 'rm -f "/mnt/media' .. GET.path .. '"' 
os.execute(cmd)
io.write(cmd)
%>
