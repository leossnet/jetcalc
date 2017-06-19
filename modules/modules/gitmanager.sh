#!/bin/bash 

com=$1
moduleName=$2
repoOwner=$3
login=$4
repoPassword=$5


case "$com" in
	install)
		cd ../../
		git submodule add -b master "https://$login:$repoPassword@github.com/$repoOwner/jetcalc_$moduleName" "./modules/$moduleName/"
		git reset .gitmodules
		git reset "modules/$moduleName"
		echo "/modules/$moduleName" >> .git/info/exclude
		git config core.fileMode false
		chmod -R 755 "./modules/$moduleName/"
;;
	remove)
		cd ../../
		rm -rf "modules/$moduleName"
		sed -i "s/\/modules\/$moduleName//g" .git/info/exclude
		git config -f .gitmodules  --remove-section "submodule.modules/$moduleName"
		git config -f .git/config  --remove-section "submodule.modules/$moduleName"
		rm -rf ".git/modules/modules/$moduleName/"		
	;;	
	update)
		cd "../$moduleName"
		chmod -R 644 ./
		git pull
		chmod -R 755 ./
	;;	
esac

exit 0