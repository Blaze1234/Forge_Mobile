# Forge Mobile — Setup Guide
## From zero to sideloaded iPhone app

---

## Step 1 — Install prerequisites (one time)

### On Windows:
```
# Install Node.js (if not already installed)
https://nodejs.org  →  Download LTS

# Install Expo CLI globally
npm install -g expo-cli eas-cli

# Install Git (if not already)
https://git-scm.com
```

### On Mac:
```bash
# Install Homebrew if needed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node
brew install node

# Install Expo + EAS CLI
npm install -g expo-cli eas-cli

# Install Xcode from App Store (required for iOS builds)
# After installing, open Xcode once and accept license
sudo xcodebuild -license accept
```

---

## Step 2 — Supabase Storage bucket (one time)

Go to your Supabase project → SQL Editor → run this:

```sql
-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('forge-photos', 'forge-photos', true)
ON CONFLICT DO NOTHING;

-- Allow anyone to upload/read (single-user app)
CREATE POLICY "public upload" ON storage.objects
  FOR INSERT TO anon WITH CHECK (bucket_id = 'forge-photos');

CREATE POLICY "public read" ON storage.objects
  FOR SELECT TO anon USING (bucket_id = 'forge-photos');

CREATE POLICY "public delete" ON storage.objects
  FOR DELETE TO anon USING (bucket_id = 'forge-photos');
```

---

## Step 3 — Install & run locally

```bash
# In the forge-mobile folder:
npm install

# Start development server
npx expo start
```

You'll see a QR code. Download **Expo Go** from the App Store and scan it.
Your app runs immediately on your phone over WiFi — no build needed.

> ⚠️ Camera and ML Kit work in Expo Go.
> Photo upload to Supabase works in Expo Go too.
> The only thing NOT in Expo Go: on-device handwriting OCR (ML Kit).
> For that you need a standalone build (Step 4).

---

## Step 4 — Build a standalone .ipa for sideloading

### Create an Expo account (free):
https://expo.dev → Sign up

### Login and configure:
```bash
eas login
eas build:configure
```

This creates `eas.json` — update it:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    }
  }
}
```

### Build the .ipa (cloud build — no Mac needed):
```bash
eas build --platform ios --profile preview
```

EAS builds in the cloud (~10-15 min). When done it gives you a download link for the `.ipa` file.

---

## Step 5 — Sideload with AltStore

### On your Windows PC:
1. Download **AltServer** from https://altstore.io
2. Install **iTunes** and **iCloud** from Apple's website (NOT the Microsoft Store versions)
3. Plug in iPhone via USB
4. Run AltServer → click the icon in system tray → Install AltStore → select your iPhone
5. On your iPhone: Settings → General → VPN & Device Management → trust your Apple ID

### Install the .ipa:
1. Download the `.ipa` from the EAS link
2. In AltServer system tray → Sideload an app → select the `.ipa`
3. Done — Forge appears on your home screen

### Keep it alive (apps expire after 7 days with free Apple ID):
- AltStore refreshes apps automatically when AltServer is running on same WiFi
- Or open AltStore on phone → tap "Refresh" manually

---

## Step 6 — Enable handwriting OCR in standalone build

Add this to `package.json` dependencies then rebuild:
```bash
npm install @react-native-ml-kit/text-recognition
npx expo install @react-native-ml-kit/text-recognition
eas build --platform ios --profile preview
```

ML Kit runs fully on-device — no API key, no internet needed.

---

## App features

- **Dashboard** — Work/Personal toggle, project cards with progress
- **Projects** — Create, view, delete projects
- **Project Detail** — Tasks + Notes tabs with timer
- **Camera** — Two modes:
  - 📷 **Attach Photo** — takes a photo and uploads to Supabase, attaches to note
  - ✦ **Scan Handwriting** — photos your handwritten note, runs OCR, creates a text note with the image
- **Sync** — Full bidirectional sync with your web app via Supabase (same data, both devices)

---

## File structure

```
forge-mobile/
├── App.js                    ← Entry point + navigation
├── app.json                  ← Expo config + permissions
├── src/
│   ├── store/
│   │   ├── AppContext.js     ← State management + sync
│   │   └── supabase.js       ← DB + Storage client
│   ├── hooks/
│   │   └── index.js          ← useProjects, useTasks, useNotes...
│   ├── screens/
│   │   ├── DashboardScreen.js
│   │   ├── ProjectsScreen.js
│   │   ├── ProjectDetailScreen.js
│   │   └── CameraScreen.js   ← Photo + OCR
│   ├── components/
│   │   └── index.js          ← Shared UI components
│   └── theme/
│       └── index.js          ← Colors, typography, spacing
```

## Adding a new screen

1. Create `src/screens/MyScreen.js`
2. Import in `App.js`
3. Add to Stack.Navigator or Tab.Navigator

