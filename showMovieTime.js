const client = require('cheerio-httpcli')

const now = new Date();
let halfHourFromNow = new Date();
/*今から30分後の時間*/
halfHourFromNow.setTime(now.getTime() + (30 * 60 * 1000) + (9 * 60 * 60 * 1000))
const year = halfHourFromNow.getFullYear();
const month = halfHourFromNow.getMonth() + 1;
const day = halfHourFromNow.getDate();
const milliseconds = 00;

yearStr = String(year);
monthStr = month < 10 ? '0' + String(month) : String(month);
dayStr = day < 10 ? '0' + String(day) : String(day);
const dateParam = yearStr + monthStr + dayStr;

/*TOHOシネマズ新宿の上映スケジュールを取得するAPI JSONで返ってくる。スケジュールはクライアントサイドで非同期でレンダリングしている*/
const urlToho = 'https://hlo.tohotheater.jp/net/schedule/TNPI3050J02.do?__type__=html&__useResultInfo__=no&vg_cd=076&show_day=' + dateParam + '&term=99&isMember=&enter_kbn=&_dc=1506954928N';
/*バルト9の上映スケジュールページのURL。最初からスケジュールがレンダリングされたHTMLが取得されているよう。*/
const urlWald9 = 'https://kinezo.jp/pc/schedule/index/' + yearStr + '/' + monthStr + '/' + dayStr + '?ush=140feb4';
/*新宿ピカデリーの上映スケジュールも取得したかったが、サーバーサイドで非同期でスケジュールを取得した後、一部のHTMLを返しているようで、クローリングできず。*/

let text = '';

/*TOHOシネマズ新宿のスケジュールを取得*/
client.fetch(urlToho)
.then(function (result) {
    const lineup = JSON.parse(result.body)[0].list[0].list;
    text += 'TOHOシネマズ新宿';
    for (let movie of lineup) {
        text += '\n' + movie.name + '\t';
        let times = movie.list[0].list;
        for (let time of times) {
            if (time.showingStart !== ''){
                let [hour, minute] = time.showingStart.split(':');
                hour = Number(hour);
                minute = Number(minute);
                let startTime = new Date(year, (month - 1), day, hour, minute, milliseconds);
                startTime.setTime(startTime.getTime() + (9 * 60 * 60 * 1000));
                /*上映開始時間が今から30分後以降のものを出力*/
                if (halfHourFromNow < startTime) {
                    text += time.showingStart + ' ~ ' + time.showingEnd + '  ';
                }
            }
        }
    }
})
.catch(function (err) {
    console.log(err);
})
.finally(function () {
    text += '\n\n';
});

/*バルト9のスケジュールを取得*/
client.fetch(urlWald9)
.then(function (result) {
    text += 'バルト9';
    const $ = result.$;
    let ary = [];
    const theaterTypesCls = ['.scType01', '.scType02', '.scType03', '.scType04', '.scType05'];
    $('.cinemaTitle').each(function (idx) {
        text += '\n' + $(this).text().replace(/\r?\n/g, '').replace(/作品詳細/g, '') + '\t';
        let times = $('.theaterListWrap')[idx];
        ary = [];
        for (let theater of theaterTypesCls) {
            let aryTime = $(times).find(theater).text().replace(/レイトショー/g, '').replace(/ミッドナイト/g, '').replace(/夕方割/g, '').replace(/～/g, '');
            console.log(aryTime);
            ary = ary.concat(aryTime.filter(function(e) {return e !== '';}));
        }
        for (let time of ary) {
            let [hour, minute] = time.split(':');
            hour = Number(hour);
            minute = Number(minute);
            let startTime = new Date(year, (month - 1), day, hour, minute, milliseconds);
            startTime.setTime(startTime.getTime() + (9 * 60 * 60 * 1000));
            if (halfHourFromNow < startTime) {
                minute = minute < 10 ? '0' + String(minute) : minute
                text += hour + ':' + minute + '~' + '  ';
            }
        }
    });
})
.catch(function (err) {
    console.log(err);
})
.finally(function () {
    text += '\n';
    console.log(text);
})
