# example R options set globally
options(width = 60)

# example chunk options set globally
knitr::opts_chunk$set(
  comment = "#>",
  collapse = TRUE
  )


# 
options("knitr.graphics.auto_pdf" = TRUE)

# svg to pdf and 貼 svg 圖
svg_to_pdf <- 0
include_svg = function(...) {
  #if (svg_to_pdf == 1) {
  #  for (file in c(...)){
  for (file in c(...)){
    if (file.exists(xfun::with_ext(file, 'pdf')) == FALSE){
      system2('inkscape', c('--export-type=pdf', '-T', '-d', '96', '--export-pdf-version=1.5', file))
      #print(paste('inkscape --export-type=pdf -T -d 96 --export-pdf-version=1.5', file))
    }
  }
  if (knitr::is_latex_output()) {
    output = xfun::with_ext(c(...), 'pdf')
  } else {
    output = c(...)
  }
  knitr::include_graphics(output)
}




# 用 svg_to_pdf 參數去判斷要不要轉成 pdf
# svg_to_pdf <- 0
# include_svg = function(...) {
#   if (svg_to_pdf == 1) {
#     for (file in c(...)){
#       system2('inkscape', c('--export-type=pdf', '-T', '-d', '96', '--export-pdf-version=1.5', file))
#       #print(paste('inkscape --export-type=pdf -T -d 96 --export-pdf-version=1.5', file))
#     }
#   }
#   if (knitr::is_latex_output()) {
#     output = xfun::with_ext(c(...), 'pdf')
#   } else {
#     output = c(...)
#   }
#   knitr::include_graphics(output)
# }

# inkscape "C:\Users\ChoCho\Documents\GitHub\_Code\R\gAradial.svg" -o "C:\Users\ChoCho\Documents\GitHub\_Code\R\gAradial.pdf"
# inkscape --export-type=pdf --export-dpi=96 --export-pdf-version=1.5 test.svg
# inkscape --export-type=pdf -d 96 my.svg

# fun <- function (...) {
#     return(list(...))
# }
# fun(a=1, b=2, weather=c("sunny", "warm"))
# fun("a","b","c")[[2]]

# copy
# svg_to_pdf <- 0
# include_svg = function(path) {
#   if (svg_to_pdf == 1) {
#     system2('inkscape', c('--export-type=pdf', '-T', '-d', '96', '--export-pdf-version=1.5', path))  
#     #shell("inkscape --export-type=pdf -T --export-dpi=96 test.svg")
#   }
#   if (knitr::is_latex_output()) {
#     output = xfun::with_ext(path, 'pdf')
#   } else {
#     output = path
#   }
#   knitr::include_graphics(output)
# }





# 設定圖片強制位置
# https://bookdown.org/yihui/rmarkdown-cookbook/figure-placement.html
# fig.show="hold" 多圖並排
knitr::opts_chunk$set(fig.pos = "h", out.extra = "", out.height= "100%", fig.show="hold", fig.align="center")  


# lipsum in R
lipsum = function(n){
  paste(stringi::stri_rand_lipsum(n, start_lipsum = FALSE), collapse = "\n\n")
}

# is word output
is_word_output <- function(fmt = knitr:::pandoc_to()) {
  length(fmt) == 1 && fmt == "docx"
}