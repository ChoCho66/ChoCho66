# lipsum in R
lipsum = function(n){
  paste(stringi::stri_rand_lipsum(n, start_lipsum = FALSE), collapse = "\n\n")
}
