# fertilmobile
Version mobile de la aplicacion creciente fertil



## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

##  Set up android app

### Add capacitor.config.json in the root folfer
This is a example
{
  "appId": "com.fertmob.app",
  "appName": "fert-mob",
  "webDir": "dist",
  "linuxAndroidStudioPath": "/opt/android-studio-2024.2.2/android-studio/bin/studio.sh"
}
Sino te tira error de app sin id
### Add android
First, run

```
npx cap add android
```

Every time you make code changes, you then run `pnpm run build && npx cap sync` to sync the changes to the android project. Execute that step now.
Con fecha y hora
pnpm run build && npx cap sync && date

Install Android Studio if you haven't and open the project with 
`npx cap open android`.
npx cap open android
si quiero tener el logo y el splahs screen
npx capacitor-assets generate --android
npx capacitor-assets generate --ios


## Add device in android studio
1. Click burger option
2. Go to view
3. Go to tool windows
4. Select "Device manager"
5. Run the first option

## run device in android studio
1. Click play button in the center of the up toolbar




## Build to dev apk
1. Click burger option
2. Go to build
3. Go to Build app bundler/apk
4. Select "Build apk"


# IOS
## INSTALL IOS
pnpm install @capacitor/ios

# add ios
npx cap add ios
