This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Notion 연동 설정

발제문 탭의 노션 가져오기/내보내기 기능은 서버 환경변수가 필요합니다.

```bash
NOTION_API_KEY=secret_your_notion_integration_token
NOTION_PARENT_PAGE_ID=your_parent_page_id_for_exports
```

- 가져오기에는 `NOTION_API_KEY`가 필요합니다.
- 내보내기에는 `NOTION_API_KEY`와 `NOTION_PARENT_PAGE_ID`가 필요합니다.
- 가져올 노션 페이지나 내보낼 상위 페이지에 해당 Integration을 초대해야 합니다.
- Vercel 배포 환경에서는 Project Settings > Environment Variables에 같은 값을 추가한 뒤 재배포하세요.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
