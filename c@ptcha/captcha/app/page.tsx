import Captcha from "./components/captcha";
async function fetchCaptchaData() {
  const response = await fetch("http://localhost:3000/api/generate-captcha", {
    cache: "no-store", // Ensure fresh data on every request
  });
  if (!response.ok) {
    throw new Error("Failed to fetch CAPTCHA data");
  }
  return response.json();
}

export default async function Home() {
  const captchaData = await fetchCaptchaData();
  console.log(captchaData);
  console.log(captchaData.imageUrl);
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Captcha
          sessionId={captchaData.sessionId}
          imageUrl={captchaData.imageUrl}

        />
      </main>
    </div>
  );
}