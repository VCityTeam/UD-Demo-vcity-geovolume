## Installing and running this demonstration

The demonstration can be locally (on your desktop) started in the following way (fist, check if you have the [pre-requisites](#Pre-requisites)):

```
npm install
npm run debug      # integrates building
```

and then use your favorite (web) browser to open
`http://localhost:8000/`.

Note that technically the `npm run debug` command will use the [webpack-dev-server npm package](https://github.com/webpack/webpack-dev-server) that

- runs node application that in turn launched a vanilla http sever in local (on your desktop)
- launches a watcher (surveying changes in sources)
- in case of change that repacks an updated bundle
- that triggers a client (hot) reload

## Technical notes concerning the template application

Some modules used by the DemoFull require some server-side components to be installed on
some server (possibly your desktop). For example

- the 3D objects (buildings) are (by default) serverd by a LIRIS server
  and thus require no specific configuratione there is nothing more to do
- handling of documents will require you to [install the API_enhanced_city](https://github.com/VCityTeam/UD-Serv/blob/master/API_Enhanced_City/INSTALL.md).
- you can also modify the [application configuration file](assets/config/config.json)

## Pre-requisites

As for any JavaScript application, the central building/running tool is [npm (Node Package Manager)](<https://en.wikipedia.org/wiki/Npm_(software)>) whose installation process is OS dependent:

- **Ubuntu**

  - Installation

    ```bash
    sudo apt-get install npm    ## Will pull NodeJS
    sudo npm install -g n
    sudo n latest
    ```

  - References: [how can I update Nodejs](https://askubuntu.com/questions/426750/how-can-i-update-my-nodejs-to-the-latest-version), and [install Ubuntu](http://www.hostingadvice.com/how-to/install-nodejs-ubuntu-14-04/#ubuntu-package-manager)

- **Windows**

  - Installing from the [installer](https://nodejs.org/en/download/)
  - Installing with the [CLI](https://en.wikipedia.org/wiki/Command-line_interface)

    ```bash
    iex (new-object net.webclient).downstring(‘https://get.scoop.sh’)
    scoop install nodejs
    ```
