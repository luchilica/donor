import React from 'react';
import { ArrowLeft, Shield, CheckCircle, FileText } from 'lucide-react';

interface PrivacyPolicyProps {
  language: 'RU' | 'BY';
  onBack: () => void;
}

export default function PrivacyPolicy({ language, onBack }: PrivacyPolicyProps) {
  const isRu = language === 'RU';

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-50 rounded-2xl text-red-650 text-red-600">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {isRu ? 'Политика конфиденциальности' : 'Палітыка канфідэнцыяльнасці'}
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {isRu ? 'Республика Беларусь' : 'Рэспубліка Беларусь'}
            </p>
          </div>
        </div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition duration-150 border border-slate-200 shadow-xs cursor-pointer min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          {isRu ? 'Вернуться назад' : 'Вярнуцца назад'}
        </button>
      </div>

      {/* Main Content */}
      <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-6 text-sm">
        {isRu ? (
          <>
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                <span className="text-red-500 font-mono">1.</span> Общие положения
              </h2>
              <p>
                Настоящая Политика конфиденциальности (далее – Политика) разработана в строгом соответствии с <strong>Законом Республики Беларусь от 7 мая 2021 г. № 99-З «О защите персональных данных»</strong> (далее – Закон) и иными актами законодательства Республики Беларусь.
              </p>
              <p>
                Политика определяет порядок обработки персональных данных пользователей платформы «Донор-Алерт» (далее – Платформа, Сайт) и меры по обеспечению безопасности персональных данных, принимаемые <strong>Оператором</strong>.
              </p>
              <p>
                В соответствии с требованиями <strong>Указа Президента Республики Беларусь от 1 февраля 2010 г. № 60</strong>, базы данных Платформы, содержащие персональные данные граждан Республики Беларусь, физически размещены и обрабатываются на серверах, расположенных на территории Республики Беларусь.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                <span className="text-red-500 font-mono">2.</span> Используемые термины
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Оператор</strong> – государственный орган, юридическое лицо Республики Беларусь, физическое лицо, в том числе индивидуальный предприниматель, самостоятельно или совместно с другими лицами организующие и (или) осуществляющие обработку персональных данных.</li>
                <li><strong>Субъект персональных данных</strong> – физическое лицо, в отношении которого осуществляется обработка персональных данных (в рамках Платформы – Пользователь, Донор).</li>
                <li><strong>Уполномоченное лицо</strong> – государственный орган, юридическое лицо Республики Беларусь, физическое лицо, которое в соответствии с законодательством либо договором осуществляет обработку персональных данных от имени Оператора (например, медицинские учреждения / центры крови Республики Беларусь).</li>
                <li><strong>Персональные данные</strong> – любая информация, относящаяся к идентифицированному физическому лицу или физическому лицу, которое может быть идентифицировано.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                <span className="text-red-500 font-mono">3.</span> Цели обработки персональных данных
              </h2>
              <p>Оператор обрабатывает персональные данные в следующих целях:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Оповещение доноров о необходимости сдачи крови и её компонентов (двухканальная система: Push-уведомления и Email-рассылки);</li>
                <li>Координация взаимодействия пользователей с государственными центрами трансфузиологии (центрами крови) Республики Беларусь;</li>
                <li>Предоставление пользователю доступа к личному кабинету донора, ведение электронной карты донора и истории донаций;</li>
                <li>Информирование о новостях и мероприятиях в сфере донорства в Республике Беларусь.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                <span className="text-red-500 font-mono">4.</span> Перечень обрабатываемых данных
              </h2>
              <p>В рамках Платформы обрабатываются следующие персональные данные:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Фамилия, Имя, Отчество (при наличии);</li>
                <li>Дата рождения и пол;</li>
                <li>Контактный номер телефона и адрес электронной почты (E-mail);</li>
                <li>Медицинские сведения: группа крови, резус-фактор, наличие временных или постоянных медицинских противопоказаний (медотводов), история донаций.</li>
              </ul>
            </section>

            <section className="space-y-3 bg-red-50/50 p-5 rounded-2xl border border-red-100">
              <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                <span className="text-red-650 text-red-600 font-mono">5.</span> Права субъекта персональных данных и механизм их реализации
              </h2>
              <p>
                В соответствии со статьями 10–13 Закона № 99-З Субъект персональных данных Республики Беларусь имеет следующие права:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Право на отзыв согласия
                  </h4>
                  <p className="text-slate-500">
                    Вы имеете право в любое время без объяснения причин отозвать свое согласие на обработку данных. Отзыв осуществляется в той же форме, в которой согласие было дано, либо путем направления заявления.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Право на получение информации
                  </h4>
                  <p className="text-slate-500">
                    Вы вправе запросить сведения об обработке Ваших персональных данных и получить их в течение <strong>5 рабочих дней</strong> бесплатно.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Право на изменение данных
                  </h4>
                  <p className="text-slate-500">
                    В случае неточности или неактуальности данных, Оператор обязан внести изменения в течение <strong>15 календарных дней</strong> после получения требования.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Право на удаление и прекращение
                  </h4>
                  <p className="text-slate-500">
                    Вы имеете право требовать прекращения обработки и полного удаления Ваших персональных данных («право на забвение») при отсутствии законных оснований для их дальнейшей обработки. Срок рассмотрения – <strong>15 календарных дней</strong>.
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-red-100 text-xs text-slate-700 space-y-2">
                <p>
                  <strong>Как подать заявление:</strong> Для реализации указанных прав Вам необходимо направить Оператору официальное заявление в письменной форме (почтовым отправлением по адресу Оператора) либо в форме электронного документа, подписанного электронной цифровой подписью, на e-mail: <span className="font-mono text-red-650 text-red-600 font-semibold">support@donor-alert.by</span>.
                </p>
                <p>
                  <strong>Право на обжалование:</strong> Если Вы считаете, что обработка Ваших данных нарушает законодательство, Вы вправе обжаловать действия Оператора в уполномоченный орган по защите прав субъектов персональных данных – <strong>Национальный центр защиты персональных данных Республики Беларусь (НЦЗПД)</strong>.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                <span className="text-red-500 font-mono">6.</span> Трансграничная передача и уполномоченные лица
              </h2>
              <p>
                Трансграничная передача персональных данных пользователей на территорию иностранных государств не осуществляется без Вашего предварительного согласия.
              </p>
              <p>
                Оператор вправе поручить обработку персональных данных <strong>Уполномоченным лицам</strong> – государственным учреждениям здравоохранения (Региональным центрам трансфузиологии, РНПЦ трансфузиологии и медицинских биотехнологий) исключительно для ведения медицинского учета доноров, верификации отводов от донорства и планирования процедур забора крови.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                <span className="text-red-500 font-mono">7.</span> Заключительные положения
              </h2>
              <p>
                Настоящая Политика вступает в силу с момента её публикации на Платформе. Оператор имеет право вносить изменения в настоящую Политику в одностороннем порядке. Новая редакция Политики вступает в силу с момента её размещения на Сайте, если иное не предусмотрено новой редакцией Политики.
              </p>
            </section>
          </>
        ) : (
          <>
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                <span className="text-red-500 font-mono">1.</span> Агульныя палажэнні
              </h2>
              <p>
                Дадзеная Палітыка канфідэнцыяльнасці (далей – Палітыка) распрацавана ў строгай адпаведнасці з <strong>Законам Рэспублікі Беларусь ад 7 мая 2021 г. № 99-З «Аб абароне персанальных дадзеных»</strong> (далей – Закон) і іншымі актамі заканадаўства Рэспублікі Беларусь.
              </p>
              <p>
                Палітыка вызначае парадак апрацоўкі персанальных дадзеных карыстальнікаў платформы «Донар-Алерт» (далей – Платформа, Сайт) і меры па забеспячэнню бяспекі персанальных дадзеных, якія прымаюцца <strong>Аператарам</strong>.
              </p>
              <p>
                У адпаведнасці з патрабаваннямі <strong>Указа Прэзідэнта Рэспублікі Беларусь ад 1 лютага 2010 г. № 60</strong>, базы дадзеных Платформы, якія змяшчаюць персанальныя дадзеныя грамадзян Рэспублікі Беларусь, фізічна размешчаны і апрацоўваюцца на серверах, размешчаных на тэрыторыі Рэспублікі Беларусь.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                <span className="text-red-500 font-mono">2.</span> Тэрміны, якія выкарыстоўваюцца
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Аператар</strong> – дзяржаўны орган, юрыдычная асоба Рэспублікі Беларусь, фізічная асоба, у тым ліку індывідуальны прадпрымальнік, якія самастойна або сумесна з іншымі асобамі арганізуюць і (або) ажыццяўляюць апрацоўку персанальных дадзеных.</li>
                <li><strong>Суб'ект персанальных дадзеных</strong> – фізічная асоба, у дачыненні да якой ажыццяўляецца апрацоўка персанальных дадзеных (у межах Платформы – Карыстальнік, Донар).</li>
                <li><strong>Упаўнаважаная асоба</strong> – дзяржаўны орган, юрыдычная асоба Рэспублікі Беларусь, фізічная асоба, якая ў адпаведнасці з заканадаўствам або дамовай ажыццяўляе апрацоўку персанальных дадзеных ад імя Аператара (напрыклад, медыцынскія ўстановы / цэнтры крыві Рэспублікі Беларусь).</li>
                <li><strong>Персанальныя дадзеныя</strong> – любая інфармацыя, якая адносіцца да ідэнтыфікаванай фізічнай асобы або фізічнай асобы, якая можа быць ідэнтыфікавана.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                <span className="text-red-500 font-mono">3.</span> Мэты апрацоўкі персанальных дадзеных
              </h2>
              <p>Аператар апрацоўвае персанальныя дадзеныя ў наступных мэтах:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Апавяшчэнне донараў аб неабходнасці здачы крыві і яе кампанентаў (двухканальная сістэма: Push-апавяшчэнні і Email-рассылкі);</li>
                <li>Каардынацыя ўзаемадзеяння карыстальнікаў з дзяржаўнымі цэнтрамі трансфузіялогіі (цэнтрамі крыві) Рэспублікі Беларусь;</li>
                <li>Прылада карыстальніку доступу да асабістага кабінета донара, вядзенне электроннай карты донара і гісторыі данацый;</li>
                <li>Інфармаванне аб навінах і мерапрыемствах у сферы донарства ў Рэспубліцы Беларусь.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                <span className="text-red-500 font-mono">4.</span> Пералік дадзеных, якія апрацоўваюцца
              </h2>
              <p>У межах Платформы апрацоўваюцца наступныя персанальныя дадзеныя:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Прозвішча, Імя, Імя па бацьку (пры наяўнасці);</li>
                <li>Дата нараджэння і пол;</li>
                <li>Кантактны нумар тэлефона і адрас электроннай пошты (E-mail);</li>
                <li>Медыцынскія звесткі: група крыві, рэзус-фактар, наяўнасць часовых або пастаянных медыцынскіх супрацьпаказанняў (медадводаў), гісторыя данацый.</li>
              </ul>
            </section>

            <section className="space-y-3 bg-red-50/50 p-5 rounded-2xl border border-red-100">
              <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                <span className="text-red-650 text-red-600 font-mono">5.</span> Правы суб'екта персанальных дадзеных і механізм іх рэалізацыі
              </h2>
              <p>
                У адпаведнасці з артыкуламі 10–13 Закона № 99-З Суб'ект персанальных дадзеных Рэспублікі Беларусь мае наступныя правы:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Права на водгук згоды
                  </h4>
                  <p className="text-slate-500">
                    Вы маеце права ў любы час без тлумачэння прычын адклікаць сваю згоду на апрацоўку дадзеных. Водгук ажыццяўляецца ў той жа форме, у якой згода была дадзена, альбо шляхам накіравання заявы.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Права на атрыманне інфармацыі
                  </h4>
                  <p className="text-slate-500">
                    Вы маеце права запытаць звесткі аб апрацоўцы Вашых персанальных дадзеных і атрымаць іх на працягу <strong>5 рабочых дзён</strong> бясплатна.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Права на змяненне дадзеных
                  </h4>
                  <p className="text-slate-500">
                    У выпадку недакладнасці або неактуальнасці дадзеных, Аператар абавязаны ўнесці змены на працягу <strong>15 каляндарных дзён</strong> пасля атрымання патрабавання.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Права на выдаленне і спыненне
                  </h4>
                  <p className="text-slate-500">
                    Вы маеце права патрабаваць спынення апрацоўкі і поўнага выдалення Вашых персанальных дадзеных («права на забыццё») пры адсутнасці законных падстаў для іх далейшай апрацоўкі. Тэрмін разгляду – <strong>15 каляндарных дзён</strong>.
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-red-100 text-xs text-slate-700 space-y-2">
                <p>
                  <strong>Як падаць заяву:</strong> Для рэалізацыі названых правоў Вам неабходна накіраваць Аператару афіцыйную заяву ў пісьмовай форме (паштовым адпраўленнем па адрасе Аператара) альбо ў форме электроннага дакумента, падпісанага электронным лічбавым подпісам, на e-mail: <span className="font-mono text-red-650 text-red-600 font-semibold">support@donor-alert.by</span>.
                </p>
                <p>
                  <strong>Права на абскарджанне:</strong> Калі Вы лічыце, што апрацоўка Вашых дадзеных парушае заканадаўства, Вы маеце права абскардзіць дзеянні Аператара ва ўпаўнаважаны орган па абароне правоў суб'ектаў персанальных дадзеных – <strong>Нацыянальны цэнтр абароны персанальных дадзеных Рэспублікі Беларусь (НЦАПД)</strong>.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                <span className="text-red-500 font-mono">6.</span> Трансгранічная перадача і ўпаўнаважаныя асобы
              </h2>
              <p>
                Трансгранічная перадача персанальных дадзеных карыстальнікаў на тэрыторыю замежных дзяржаў не ажыццяўляецца без Вашай папярэдняй згоды.
              </p>
              <p>
                Аператар мае права даручыць апрацоўку персанальных дадзеных <strong>Упаўнаважаным асобам</strong> – дзяржаўным установам аховы здароўя (Рэгіянальным цэнтрам трансфузіялогіі, РНПЦ трансфузіялогіі і медыцынскіх біятэхналогій) выключна для вядзення медыцынскага ўліку донараў, верыфікацыі адводаў ад донарства і планавання працэдур забору крыві.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                <span className="text-red-500 font-mono">7.</span> Заключныя палажэнні
              </h2>
              <p>
                Дадзеная Палітыка ўступае ў сілу з моманту яе публікацыі на Платформе. Аператар мае права ўносіць змены ў гэтую Палітыку ў аднабаковым парадку. Новая рэдакцыя Палітыкі ўступае ў сілу з моманту яе размяшчэння на Сайце, калі іншае не прадугледжана новай рэдакцыяй Палітыкі.
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
