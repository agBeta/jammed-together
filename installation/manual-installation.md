## Node.js via snap
https://github.com/nodejs/snap

#### what is snap?
According to https://ubuntuhandbook.org/index.php/2021/01/earch-install-remove-snap-apps-command-line/#google_vignette:  
```
snap find obsidian
snap install vlc --classic
snap install vlc --channel beta  
```

Snap app runs in a sandbox environment. It by default has no access to files outside user’s home directory.
You can however disable the security confinement by installing snap in --classic mode: `snap install APP_NAME --classic`  

To list all installed snap applications, simply run snap list in terminal:  `snap list`  

`snap remove vlc`  
The previous remove command will leave a snapshot of app data on your system.  
Use --purge flag will clear all the app data: `snap remove --purge vlc`  

By running `snap list --all` command in terminal, you may see some old versions of app packages left in system marked as “disabled”. To remove one of the disabled package, there’s a ‘revision‘ flag can do the job. For example, remove chromium marked as rev 2254:  
`snap remove chromium --revision=2254`  
revision flag for a package can be found in: `snap list --all`  

Thanks to @Fernando, the command below will free up disk space by removing all the old disabled snap packages:
`snap list --all | awk '/disabled/{system("sudo snap remove " $1 " --revision=" $3)}'`  

</br>

## install zsh
aside: To see current shell:  echo $SHELL .
According to https://github.com/ThePrimeagen/dev-productivity/blob/main/lessons/ansible.md:

sudo apt install zsh  
chsh -s $(which zsh)  
curl -L https://raw.github.com/robbyrussell/oh-my-zsh/master/tools/install.sh | sh  
... and so on.

</br>

## remove vscode
One of these:
sudo snap remove code
sudo apt remove code


</br>

## Fonts
According to [this](https://askubuntu.com/a/3706):   
If you need the fonts to be available system-wide, you'll need to copy them to /usr/local/share/fonts (or usr/share/fonts ?? user123492 says the same thing in comments below) and reboot (or manually rebuild the font cache with fc-cache -f -v). You can confirm they are installed correctly by running fc-list | grep "<name-of-font>"


</br>

## i3
sudo apt install i3  
logout and choose i3 as you wm  
select you mod key (Win key)  
mod + shift + r (restart i3)
sudo dpkg -i path-to-playerctl

monitors:
arandr
xprop -> default workspace -> WM_Class -> second value

i3lock --> end of command add something. it becomes:
bindsym ... i3lock --color "$bg-color"

</br>

# This file has been auto-generated by i3-config-wizard(1).
# It will not be overwritten, so edit it as you like.
#
# Should you change your keyboard layout some time, delete
# this file and re-run i3-config-wizard(1).
#

# i3 config file (v4)
#
# Please see https://i3wm.org/docs/userguide.html for a complete reference!

set $mod Mod4

# Font for window titles. Will also be used by the bar unless a different font
# is used in the bar {} block below.
font pango:monospace 11

# This font is widely installed, provides lots of unicode glyphs, right-to-left
# text rendering and scalability on retina/hidpi displays (thanks to pango).
#font pango:DejaVu Sans Mono 11

# Start XDG autostart .desktop files using dex. See also
# https://wiki.archlinux.org/index.php/XDG_Autostart
exec --no-startup-id dex --autostart --environment i3

# The combination of xss-lock, nm-applet and pactl is a popular choice, so
# they are included here as an example. Modify as you see fit.

# xss-lock grabs a logind suspend inhibit lock and will use i3lock to lock the
# screen before suspend. Use loginctl lock-session to lock your screen.
exec --no-startup-id xss-lock --transfer-sleep-lock -- i3lock --nofork

# NetworkManager is the most popular way to manage wireless networks on Linux,
# and nm-applet is a desktop environment-independent system tray GUI for it.
exec --no-startup-id nm-applet

# Use pactl to adjust volume in PulseAudio.
set $refresh_i3status killall -SIGUSR1 i3status
bindsym XF86AudioRaiseVolume exec --no-startup-id pactl set-sink-volume @DEFAULT_SINK@ +10% && $refresh_i3status
bindsym XF86AudioLowerVolume exec --no-startup-id pactl set-sink-volume @DEFAULT_SINK@ -10% && $refresh_i3status
bindsym XF86AudioMute exec --no-startup-id pactl set-sink-mute @DEFAULT_SINK@ toggle && $refresh_i3status
bindsym XF86AudioMicMute exec --no-startup-id pactl set-source-mute @DEFAULT_SOURCE@ toggle && $refresh_i3status

# Use Mouse+$mod to drag floating windows to their wanted position
floating_modifier $mod

# start a terminal
bindsym $mod+Return exec i3-sensible-terminal

# kill focused window
bindsym $mod+Shift+q kill

# start dmenu (a program launcher)
bindsym $mod+d exec --no-startup-id dmenu_run
# A more modern dmenu replacement is rofi:
# bindcode $mod+40 exec "rofi -modi drun,run -show drun"
# There also is i3-dmenu-desktop which only displays applications shipping a
# .desktop file. It is a wrapper around dmenu, so you need that installed.
# bindcode $mod+40 exec --no-startup-id i3-dmenu-desktop

# change focus
bindsym $mod+j focus left
bindsym $mod+k focus down
bindsym $mod+l focus up
bindsym $mod+semicolon focus right

# alternatively, you can use the cursor keys:
bindsym $mod+Left focus left
bindsym $mod+Down focus down
bindsym $mod+Up focus up
bindsym $mod+Right focus right

# move focused window
bindsym $mod+Shift+j move left
bindsym $mod+Shift+k move down
bindsym $mod+Shift+l move up
bindsym $mod+Shift+semicolon move right

# alternatively, you can use the cursor keys:
bindsym $mod+Shift+Left move left
bindsym $mod+Shift+Down move down
bindsym $mod+Shift+Up move up
bindsym $mod+Shift+Right move right

# split in horizontal orientation
bindsym $mod+h split h

# split in vertical orientation
bindsym $mod+v split v

# enter fullscreen mode for the focused container
bindsym $mod+f fullscreen toggle

# change container layout (stacked, tabbed, toggle split)
bindsym $mod+s layout stacking
bindsym $mod+w layout tabbed
bindsym $mod+e layout toggle split

# toggle tiling / floating
bindsym $mod+Shift+space floating toggle

# change focus between tiling / floating windows
bindsym $mod+space focus mode_toggle

# focus the parent container
bindsym $mod+a focus parent

# focus the child container
#bindsym $mod+d focus child

# Define names for default workspaces for which we configure key bindings later on.
# We use variables to avoid repeating the names in multiple places.
set $ws1 "1: Terminals "
set $ws2 "2: Code "
set $ws3 "3: Video "
set $ws4 "4: "
set $ws5 "5 "
set $ws6 "6 "
set $ws7 "7 "
set $ws8 "8 "
set $ws9 "9: Firefox "
set $ws10 "10: Files "

# switch to workspace
bindsym $mod+1 workspace number $ws1
bindsym $mod+2 workspace number $ws2
bindsym $mod+3 workspace number $ws3
bindsym $mod+4 workspace number $ws4
bindsym $mod+5 workspace number $ws5
bindsym $mod+6 workspace number $ws6
bindsym $mod+7 workspace number $ws7
bindsym $mod+8 workspace number $ws8
bindsym $mod+9 workspace number $ws9
bindsym $mod+0 workspace number $ws10

# move focused container to workspace
bindsym $mod+Shift+1 move container to workspace number $ws1
bindsym $mod+Shift+2 move container to workspace number $ws2
bindsym $mod+Shift+3 move container to workspace number $ws3
bindsym $mod+Shift+4 move container to workspace number $ws4
bindsym $mod+Shift+5 move container to workspace number $ws5
bindsym $mod+Shift+6 move container to workspace number $ws6
bindsym $mod+Shift+7 move container to workspace number $ws7
bindsym $mod+Shift+8 move container to workspace number $ws8
bindsym $mod+Shift+9 move container to workspace number $ws9
bindsym $mod+Shift+0 move container to workspace number $ws10

# reload the configuration file
bindsym $mod+Shift+c reload
# restart i3 inplace (preserves your layout/session, can be used to upgrade i3)
bindsym $mod+Shift+r restart
# exit i3 (logs you out of your X session)
bindsym $mod+Shift+e exec "i3-nagbar -t warning -m 'You pressed the exit shortcut. Do you really want to exit i3? This will end your X session.' -B 'Yes, exit i3' 'i3-msg exit'"

# resize window (you can also use the mouse for that)
mode "resize" {
        # These bindings trigger as soon as you enter the resize mode

        # Pressing left will shrink the window’s width.
        # Pressing right will grow the window’s width.
        # Pressing up will shrink the window’s height.
        # Pressing down will grow the window’s height.
        bindsym j resize shrink width 10 px or 10 ppt
        bindsym k resize grow height 10 px or 10 ppt
        bindsym l resize shrink height 10 px or 10 ppt
        bindsym semicolon resize grow width 10 px or 10 ppt

        # same bindings, but for the arrow keys
        bindsym Left resize shrink width 10 px or 10 ppt
        bindsym Down resize grow height 10 px or 10 ppt
        bindsym Up resize shrink height 10 px or 10 ppt
        bindsym Right resize grow width 10 px or 10 ppt

        # back to normal: Enter or Escape or $mod+r
        bindsym Return mode "default"
        bindsym Escape mode "default"
        bindsym $mod+r mode "default"
}

bindsym $mod+r mode "resize"


# Start i3bar to display a workspace bar (plus the system information i3status
# finds out, if available)
bar {
        status_command i3status
}

# Manually added based on Alex Booker i3wm youtube video part 2
# Sreen brightness controls
bindsym XF86MonBrightnessUp exec sudo light -A 5 # increase screen brightness
bindsym XF86MonBrightnessDown exec sudo light -U 5 # decrease screen brightness

# from askubuntu https://askubuntu.com/a/1333110
exec_always "setxkbmap -model pc104 -layout us,ir -variant ,, -option grp:alt_shift_toggle"

# part 2 minute 25:15
assign [class="Code"] $ws2		
assign [class="firefox"] $ws9
assign [class="vlc"] $ws3
assign [class="Cypress"] $ws9
assign [class="Google-chrome"] $ws9