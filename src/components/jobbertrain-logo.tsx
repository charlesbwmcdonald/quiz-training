import Image from "next/image";

export function JobberTrainLogo({className="h-8 w-auto",priority=false}:{className?:string;priority?:boolean}) {
  return <Image src="/jobbertrain-logo-long.svg" alt="JobberTrain" width={3225} height={410} className={className} priority={priority}/>;
}
