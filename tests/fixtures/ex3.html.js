exports.html = `<!doctype html>
<html class="no-js" lang="">

<head>
  <meta charset="utf-8">
  <title></title>
  <meta name="description" content="">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <meta property="og:title" content="">
  <meta property="og:type" content="">
  <meta property="og:url" content="">
  <meta property="og:image" content="">

  <link rel="manifest" href="site.webmanifest">
  <link rel="apple-touch-icon" href="icon.png">
  <!-- Place favicon.ico in the root directory -->

  <link rel="stylesheet" href="css/normalize.css">
  <link rel="stylesheet" href="css/style.css">

  <meta name="theme-color" content="#fafafa">
</head>

<body>
  <!-- Add your site or application content here -->
  <p>Hello world! This is HTML5 Boilerplate.</p>
  <script src="js/vendor/modernizr-{{MODERNIZR_VERSION}}.min.js"></script>
  <script src="js/app.js"></script>

  <picture thumbnails='true'>
      <img src='thumb.jpg' alt="example image"/>
  </picture>

  <!-- Google Analytics: change UA-XXXXX-Y to be your site's ID. -->
  <script>
    window.ga = function () { ga.q.push(arguments) }; ga.q = []; ga.l = +new Date;
    ga('create', 'UA-XXXXX-Y', 'auto'); ga('set', 'anonymizeIp', true); ga('set', 'transport', 'beacon'); ga('send', 'pageview')
  </script>
  <script src="https://www.google-analytics.com/analytics.js" async></script>

    <picture>
      <img class="image is3by2"
          src='nails.jpg'
          alt="example image"
          data-thumbnails='true'
          data-hashLen=8
          data-clean="true"
          data-types="jpg,webp"
          data-breaks="[707, 1007, 1107]"
          data-widths="[207, 307, 507, 807]"
          data-addclassnames="newClass1 newClass2"
          data-prefix="optim"
          data-suffix="---{{width}}w--{{hash}}.{{ext}}" />
    </picture>

    <picture leaveAlone="true">
      <img src='https://via.placeholder.com/150' alt="example image"/>
    </picture>

</body>
</html>`
