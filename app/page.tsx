import { permanentRedirect } from "next/navigation";

const PUBLIC_REPO_URL = "https://github.com/kuliks08/gitlab-readme-counter";

export default function HomePage() {
  permanentRedirect(PUBLIC_REPO_URL);
}
