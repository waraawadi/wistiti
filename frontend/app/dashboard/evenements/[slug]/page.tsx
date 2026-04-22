import { redirect } from "next/navigation";

export default function EvenementIndexRedirect({ params }: { params: { slug: string } }) {
  redirect(`/dashboard/evenements/${params.slug}/partage`);
}
