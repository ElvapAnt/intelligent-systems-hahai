# HandHeldAI - HAHAI
Intelligent systems project
Web aplikacija namenjena edukaciji studenata i internista radiologije kroz praktičan rad sa rendgenskim snimcima šake i ručnog zgloba. Korisnik učitava X-ray sliku, nakon čega sistem pokreće procesiranje slike pomoću unapred treniranog CNN modela i prikazuje rezultat klasifikacije (pozitivno/negativno) uz procenat pouzdanosti. Pored statistike, aplikacija generiše Grad-CAM vizuelizaciju koja ističe delove slike koji su najviše uticali na odluku modela, čime se korisniku pruža dodatno objašnjenje i podrška u učenju. Korisnik zatim može da unese sopstvene nalaze i interpretaciju u tekstualnoj formi na web stranici, a specijalisti radiologije imaju uvid u sve slučajeve i napredak internista. Rešenje omogućava učenje kroz jasnu povratnu informaciju i vizuelno objašnjenje odluka modela, čime se studentima olakšava razumevanje i samostalna analiza rendgenskih snimaka. Preciznost nalaza i uvid specijalista donosi povratnu mogućnost za dalje unapređenje samog modela nadgledanim učenjem novih slučajeva. 

To run the API: `uvicorn app.server:app`
To run the web: `npm run dev`
