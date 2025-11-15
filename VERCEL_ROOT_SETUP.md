# Setting Frontend as Root Directory in Vercel

## Option 1: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/enaihovfxs-projects/3/settings
2. Navigate to **General** → **Root Directory**
3. Set it to: `frontend`
4. Save

This will make Vercel treat the `frontend/` folder as the project root.

## Option 2: Keep Current Structure

The current `vercel.json` is configured to:
- Build from frontend folder: `cd frontend && npm install && npm run build`
- Output to: `frontend/dist`

This should work, but setting the root directory in dashboard is cleaner.

## After Setting Root Directory

Once you set the root directory to `frontend` in the dashboard:
- Vercel will automatically look for `frontend/package.json`
- Build commands will run from `frontend/` directory
- You can simplify `vercel.json` to just:
  ```json
  {
    "buildCommand": "npm install && npm run build",
    "outputDirectory": "dist"
  }
  ```

## Current Configuration

The `vercel.json` is already simplified. Once you set the root directory in the dashboard, Vercel will:
1. Use `frontend/` as the root
2. Run `npm install` in frontend
3. Run `npm run build` in frontend
4. Output to `frontend/dist`

