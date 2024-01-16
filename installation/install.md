These are some links and instructions to manually install some of required programs manually (without ansible). They also good for better understanding.

## Node.js via snap
https://github.com/nodejs/snap

## snap

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