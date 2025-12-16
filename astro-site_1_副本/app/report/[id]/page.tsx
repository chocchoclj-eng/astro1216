// app/report/[id]/page.tsx
import ReportClient from "./report-client";

type PageProps = {
  params: Promise<{ id: string }> | { id: string };
};

export default async function Page(props: PageProps) {
  const resolvedParams =
    props.params instanceof Promise ? await props.params : props.params;

  return <ReportClient reportId={resolvedParams.id} />;
}