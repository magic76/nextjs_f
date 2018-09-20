if [ -z $1 ]
then
    read -r -p "Do you want to start memcached? [y/N] " response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])+$ ]]
    then
        sudo memcached -p 11211 -m 128 -u root -d;
    fi
else 
    yarn cleanCss
fi

echo "remove all .js created by typescript."
find ./component -name '*.js' -delete
find ./pages -name '*.js' -delete
find ./util -name '*.js' -not -name 'memcache.js' -delete
find ./store -name '*.js' -delete
